import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { HealthProfileService } from './health-profile.service';
import { NutritionCalculator } from './calculator';

export class CalculateTdeeDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'Berat badan wajib berupa angka kilogram.' })
  @Min(20, { message: 'Berat badan minimal 20 kg.' })
  @Max(300, { message: 'Berat badan maksimal 300 kg.' })
  weightKg!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Tinggi badan wajib berupa angka sentimeter.' })
  @Min(100, { message: 'Tinggi badan minimal 100 cm.' })
  @Max(250, { message: 'Tinggi badan maksimal 250 cm.' })
  heightCm!: number;

  @Type(() => Number)
  @IsInt({ message: 'Usia wajib berupa bilangan bulat tahun.' })
  @Min(10, { message: 'Usia minimal 10 tahun.' })
  @Max(120, { message: 'Usia maksimal 120 tahun.' })
  age!: number;

  @IsIn(['MALE', 'FEMALE'], { message: 'Jenis kelamin wajib MALE atau FEMALE.' })
  gender!: 'MALE' | 'FEMALE';

  @IsIn(['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE'], { message: 'Tingkat aktivitas tidak dikenal.' })
  activityLevel!: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE';

  @IsIn(['WEIGHT_LOSS_LEAN_SCULPT', 'MUSCLE_GAIN_FIT_BUILD', 'MAINTENANCE_VITALITY_DAILY', 'THERAPEUTIC_DIET'], {
    message: 'Tujuan diet tidak dikenal.',
  })
  goal!: 'WEIGHT_LOSS_LEAN_SCULPT' | 'MUSCLE_GAIN_FIT_BUILD' | 'MAINTENANCE_VITALITY_DAILY' | 'THERAPEUTIC_DIET';

  @IsOptional()
  @IsArray({ message: 'Daftar alergi wajib berupa array teks.' })
  @IsString({ each: true, message: 'Setiap alergi wajib berupa teks.' })
  @ArrayMaxSize(50, { message: 'Daftar alergi maksimal 50 item.' })
  allergies?: string[];

  @IsOptional()
  @IsArray({ message: 'Daftar kondisi medis wajib berupa array teks.' })
  @IsString({ each: true, message: 'Setiap kondisi medis wajib berupa teks.' })
  @ArrayMaxSize(50, { message: 'Daftar kondisi medis maksimal 50 item.' })
  medicalConditions?: string[];

  @IsOptional()
  @IsString({ message: 'Catatan medis wajib berupa teks.' })
  @MaxLength(2000, { message: 'Catatan medis maksimal 2000 karakter.' })
  confidentialMedicalNotes?: string;
}

@Controller('api/v1/health-profile')
export class HealthProfileController {
  constructor(private readonly healthProfileService: HealthProfileService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  calculatePublicTdee(@Body() body: CalculateTdeeDto) {
    const macroBreakdown = NutritionCalculator.calculateMacroTarget(body);
    return {
      statusCode: HttpStatus.OK,
      message: 'Perhitungan TDEE dan rekomendasi makro nutrisi berhasil.',
      data: macroBreakdown,
    };
  }

  @Post(':userId')
  @HttpCode(HttpStatus.CREATED)
  async saveUserProfile(
    @Param('userId') userId: string,
    @Body() body: CalculateTdeeDto
  ) {
    const result = await this.healthProfileService.upsertProfile(userId, body);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Profil kesehatan & target gizi berhasil disimpan dengan enkripsi AES-256.',
      data: result,
    };
  }

  @Get(':userId')
  async getUserProfile(@Param('userId') userId: string) {
    const profile = await this.healthProfileService.getProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profil kesehatan pengguna tidak ditemukan. Simpan profil terlebih dahulu.');
    }
    return {
      statusCode: HttpStatus.OK,
      data: profile,
    };
  }

  @Get(':userId/history')
  async getUserProfileHistory(@Param('userId') userId: string) {
    const history = await this.healthProfileService.getProfileHistory(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Riwayat profil kesehatan dan rekam gizi berhasil diambil.',
      totalVersions: history.length,
      data: history,
    };
  }
}
