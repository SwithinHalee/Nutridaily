const { spawnSync, execSync } = require('child_process');

function isDockerCliAvailable() {
  const check = spawnSync('docker', ['--version'], { stdio: 'ignore' });
  return check.status === 0;
}

function isDockerEngineRunning() {
  const check = spawnSync('docker', ['info'], { stdio: 'ignore' });
  return check.status === 0;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function startDockerEngine() {
  console.log('Docker engine belum aktif. Memulai Docker Desktop di latar belakang...');

  // Coba jalankan via docker desktop CLI plugin
  const startCli = spawnSync('docker', ['desktop', 'start', '-d'], { stdio: 'ignore' });
  if (startCli.status !== 0) {
    // Fallback khusus Windows jika plugin belum siap
    try {
      execSync('powershell -Command "Start-Process \\"C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe\\" -WindowStyle Minimized"', { stdio: 'ignore' });
    } catch (err) {
      // Abaikan galat pemanggilan awal
    }
  }

  const timeoutSeconds = 60;
  let ready = false;
  process.stdout.write('Menunggu Docker engine siap: ');

  for (let elapsed = 0; elapsed < timeoutSeconds; elapsed += 2) {
    sleep(2000);
    process.stdout.write('.');
    if (isDockerEngineRunning()) {
      ready = true;
      break;
    }
  }

  process.stdout.write('\n');
  return ready;
}

function main() {
  if (!isDockerCliAvailable()) {
    console.error('Galat: Docker CLI tidak ditemukan di sistem Anda. Pastikan Docker Desktop terpasang.');
    process.exit(1);
  }

  if (!isDockerEngineRunning()) {
    const ready = startDockerEngine();
    if (!ready) {
      console.error('\nGalat: Batas waktu 60 detik tercapai. Docker engine belum siap merespons.');
      console.error('Silakan periksa apakah Docker Desktop dapat dijalankan di Windows.');
      console.error('Tips: Di pengaturan Docker Desktop, centang "Start Docker Desktop when you log in"');
      console.error('dan hilangkan centang "Open Docker Dashboard at startup" agar Docker selalu siap di latar belakang tanpa membuka jendela GUI.');
      process.exit(1);
    }
  }

  console.log('Docker engine aktif.');
  console.log('Menjalankan kontainer PostgreSQL 16 dan Redis 7...');
  
  try {
    execSync('docker compose up -d postgres redis', { stdio: 'inherit' });
    console.log('\nStatus kontainer database:');
    execSync('docker compose ps', { stdio: 'inherit' });
    console.log('\nDatabase siap digunakan:');
    console.log('- PostgreSQL: localhost:5432 (database: nutridaily_db, user: nutridaily_user)');
    console.log('- Redis: localhost:6379');
  } catch (error) {
    console.error('Gagal menjalankan kontainer database:', error.message);
    process.exit(1);
  }
}

main();
