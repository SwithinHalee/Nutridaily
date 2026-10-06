import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { HealthProfileService } from './health-profile.service';
import { NutritionCalculator } from './calculator';

export class CalculateTdeeDto {
  weightKg!: number;
  heightCm!: number;
  age!: number;
  gender!: 'MALE' | 'FEMALE';
  activityLevel!: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE';
  goal!: 'WEIGHT_LOSS_LEAN_SCULPT' | 'MUSCLE_GAIN_FIT_BUILD' | 'MAINTENANCE_VITALITY_DAILY' | 'THERAPEUTIC_DIET';
  allergies?: string[];
  medicalConditions?: string[];
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
}
