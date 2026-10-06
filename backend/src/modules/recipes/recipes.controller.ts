import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpStatus, HttpCode, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RecipesService } from './recipes.service';

@Controller('api/v1/recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  async listStored() {
    const data = await this.recipesService.listStoredRecipes();
    return {
      statusCode: HttpStatus.OK,
      message: 'Daftar makanan tersimpan berhasil dimuat.',
      data,
    };
  }

  @Post()
  async createStored(@Body() body: any) {
    const data = await this.recipesService.createStoredRecipe(body);
    return {
      statusCode: HttpStatus.CREATED,
      message: `Makanan "${data.title}" berhasil ditambahkan dan disimpan ke database.`,
      data,
    };
  }

  @Post('import-catalog')
  @HttpCode(HttpStatus.CREATED)
  async importCatalog() {
    const result = await this.recipesService.importCatalogIntoStore();
    return {
      statusCode: HttpStatus.CREATED,
      message: `${result.imported} resep katalog ditarik ke daftar kelola, ${result.skipped} SKU sudah ada sehingga dilewati.`,
      data: result,
    };
  }

  @Post('backfill-details')
  @HttpCode(HttpStatus.OK)
  async backfillDetails() {
    const result = await this.recipesService.backfillMissingDetails();
    return {
      statusCode: HttpStatus.OK,
      message: `${result.updated} makanan dilengkapi data transparansi, ${result.skipped} dilewati.`,
      data: result,
    };
  }

  @Post('upload-image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: RecipesService.IMAGE_MAX_BYTES },
    }),
  )
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Berkas gambar tidak terbaca. Pilih file JPG, PNG, atau WebP.');
    }
    const imageUrl = this.recipesService.processImageUpload(file);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Gambar berhasil diunggah dan tersimpan di database.',
      data: { imageUrl },
    };
  }

  @Patch(':id')
  async updateStored(@Param('id') id: string, @Body() body: any) {
    const data = await this.recipesService.updateStoredRecipe(id, body);
    return {
      statusCode: HttpStatus.OK,
      message: `Makanan "${data.title}" berhasil diperbarui.`,
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteStored(@Param('id') id: string) {
    await this.recipesService.deleteStoredRecipe(id);
    return {
      statusCode: HttpStatus.OK,
      message: `Makanan ${id} berhasil dihapus dari database.`,
    };
  }

  @Get('availability-summary')
  async availabilitySummary() {
    const data = await this.recipesService.getAvailabilitySummary();
    return {
      statusCode: HttpStatus.OK,
      message: `${data.activeNow} makanan aktif dari batas ${data.cap}. ${data.scheduledFuture} terjadwal mendatang.`,
      data,
    };
  }

  @Get('catalog')
  async getCatalog(@Query('week') week?: string) {
    const data = await this.recipesService.getCatalog(week === 'next' ? 1 : 0);
    return {
      statusCode: HttpStatus.OK,
      message: 'Katalog rotasi menu mingguan berhasil dimuat dari dapur sentral.',
      data,
    };
  }

  @Get('clean-label')
  async getCleanLabelList() {
    const data = await this.recipesService.getCleanLabelList();
    return {
      statusCode: HttpStatus.OK,
      message: 'Daftar sajian tersertifikasi Clean Label berhasil dimuat.',
      data,
    };
  }

  @Get('verify/:qrCode')
  async verifyCleanLabel(@Param('qrCode') qrCode: string) {
    const data = await this.recipesService.getCleanLabelByCode(qrCode);
    return {
      statusCode: HttpStatus.OK,
      message: 'Verifikasi Clean Label berhasil. Data asal bahan dan hasil uji laboratorium terkonfirmasi.',
      data,
    };
  }
}
