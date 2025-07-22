import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { LanguageService } from './language.service'
import {
  CreateLanguageBodyDTO,
  UpdateLanguageBodyDTO,
  LanguageResponseDTO,
  LanguageListResponseDTO,
  LanguageQueryDTO,
  LanguageIdParamDTO,
  BulkDeleteLanguagesDTO,
  MessageResponseDTO,
  GetAllLanguageResponseDTO,
} from './dto/language.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'

@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  /**
   * Creates a new language
   *
   * @param createLanguageDto - The language data to create
   * @returns Promise resolving to the created language
   *
   * @example
   * POST /languages
   * Body: { "id": "en", "name": "English" }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(LanguageResponseDTO)
  async createLanguage(@Body() createLanguageDto: CreateLanguageBodyDTO, @ActiveUser('userId') userId: number) {
    return await this.languageService.createLanguage({
      data: createLanguageDto,
      createdById: userId,
    })
  }

  /**
   * Retrieves list of languages
   * @returns Promise resolving language list
   *
   * @example
   * GET /languages
   */
  @Get()
  @ZodSerializerDto(GetAllLanguageResponseDTO)
  async getAllLanguages() {
    return await this.languageService.getAllLanguage()
  }

  /**
   * Retrieves a paginated list of languages with optional search and filtering
   *
   * @param queryParams - Query parameters for pagination, search, and filtering
   * @returns Promise resolving to paginated language list
   *
   * @example
   * GET /languages/pagination?page=1&limit=10&search=eng&includeDeleted=false
   */
  @Get('pagination')
  @ZodSerializerDto(LanguageListResponseDTO)
  async findAllLanguages(@Query() queryParams: LanguageQueryDTO) {
    return await this.languageService.findAllLanguages(queryParams)
  }

  /**
   * Retrieves a single language by ID
   *
   * @param params - Path parameters containing the language ID
   * @returns Promise resolving to the language
   *
   * @example
   * GET /languages/en
   */
  @Get(':id')
  @ZodSerializerDto(LanguageResponseDTO)
  async findOneLanguage(@Param() params: LanguageIdParamDTO) {
    return await this.languageService.findOneLanguage(params.id)
  }

  /**
   * Retrieves a language with all its related translations and user information
   *
   * @param params - Path parameters containing the language ID
   * @returns Promise resolving to the language with relations
   *
   * @example
   * GET /languages/en/relations
   */
  @Get(':id/relations')
  async findLanguageWithRelations(@Param() params: LanguageIdParamDTO) {
    return await this.languageService.findLanguageWithRelations(params.id)
  }

  /**
   * Updates an existing language
   *
   * @param params - Path parameters containing the language ID
   * @param updateLanguageDto - The data to update
   * @returns Promise resolving to the updated language
   *
   * @example
   * PATCH /languages/en
   * Body: { "name": "English (Updated)" }
   */
  @Patch(':id')
  @ZodSerializerDto(LanguageResponseDTO)
  async updateLanguage(
    @Param() params: LanguageIdParamDTO,
    @Body() updateLanguageDto: UpdateLanguageBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return await this.languageService.updateLanguage({
      id: params.id,
      updateLanguageDto,
      updatedById: userId,
    })
  }

  /**
   * Soft deletes a language
   *
   * @param params - Path parameters containing the language ID
   * @returns Promise resolving to success message
   *
   * @example
   * DELETE /languages/en
   */
  @Delete(':id')
  @ZodSerializerDto(MessageResponseDTO)
  async softDeleteLanguage(@Param() params: LanguageIdParamDTO) {
    return await this.languageService.softDeleteLanguage(params.id)
  }

  /**
   * Restores a soft-deleted language
   *
   * @param params - Path parameters containing the language ID
   * @returns Promise resolving to the restored language
   *
   * @example
   * PATCH /languages/en/restore
   */
  @Patch(':id/restore')
  @ZodSerializerDto(LanguageResponseDTO)
  async restoreLanguage(@Param() params: LanguageIdParamDTO) {
    return await this.languageService.restoreLanguage(params.id)
  }

  /**
   * Permanently deletes a language
   * WARNING: This action cannot be undone
   *
   * @param params - Path parameters containing the language ID
   * @returns Promise resolving to success message
   *
   * @example
   * DELETE /languages/en/permanent
   */
  @Delete(':id/permanent')
  @ZodSerializerDto(MessageResponseDTO)
  async hardDeleteLanguage(@Param() params: LanguageIdParamDTO) {
    return await this.languageService.hardDeleteLanguage(params.id)
  }

  /**
   * Bulk soft deletes multiple languages
   *
   * @param bulkDeleteDto - Object containing array of language IDs to delete
   * @returns Promise resolving to success message with count
   *
   * @example
   * DELETE /languages/bulk
   * Body: { "ids": ["en", "fr", "de"] }
   */
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResponseDTO)
  async bulkSoftDeleteLanguages(@Body() bulkDeleteDto: BulkDeleteLanguagesDTO) {
    return await this.languageService.bulkSoftDeleteLanguages(bulkDeleteDto)
  }

  /**
   * Gets the total count of languages
   *
   * @param query - Query parameters for filtering
   * @returns Promise resolving to the total count
   *
   * @example
   * POST /languages/count?includeDeleted=false
   */
  @Post('count')
  async getLanguageCount(@Query('includeDeleted') includeDeleted?: string) {
    const includeDeletedBool = includeDeleted === 'true'
    return await this.languageService.getLanguageCount(includeDeletedBool)
  }
}
