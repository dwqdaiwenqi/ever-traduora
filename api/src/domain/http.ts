import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Validate,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProjectRole } from '../entity/project-user.entity';
import { IsNotOnlyWhitespace } from '../validators/IsNotOnlyWhitespace';

export interface JwtPayload {
  sub: string;
  type: string;
  // Session version of the user when the token was issued; tokens from before versions existed have none (0)
  sv?: number;
}

export enum GrantType {
  Password = 'password',
  ClientCredentials = 'client_credentials',
}

export class UserInfoDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ description: 'Whether the owner confirmed this email, e.g. through the link emailed at signup' })
  emailVerified: boolean;
}

export class AccessTokenDTO {
  @ApiProperty()
  access_token: string;
  @ApiProperty()
  expires_in: string;
  @ApiProperty()
  token_type: string;
}

export class ImportTermsDTO {
  @ApiProperty()
  added: number;
  @ApiProperty()
  skipped: number;
}

export class ImportTranslationsDTO {
  @ApiProperty()
  upserted: number;
}

export class ImportFileDTO {
  @ApiProperty()
  terms: ImportTermsDTO;

  @ApiProperty()
  translations: ImportTranslationsDTO;
}

export class LocaleDTO {
  @ApiProperty()
  code: string;
  @ApiProperty()
  language: string;
  @ApiProperty()
  region: string;
}

export class AccessDatesDTO {
  @ApiProperty()
  created: string;
  @ApiProperty()
  modified: string;
}

export class ProjectDTO {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  localesCount: number;
  @ApiProperty()
  termsCount: number;
  @ApiProperty({ enum: ProjectRole })
  role: ProjectRole;
  @ApiProperty()
  date: AccessDatesDTO;
}

export class ProjectPlanDTO {
  @ApiProperty()
  code: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  maxStrings: number;
  @ApiProperty()
  date: AccessDatesDTO;
}

export class ProjectUserDTO {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  email: string;
  @ApiProperty({ enum: ProjectRole })
  role: ProjectRole;
}

export class ProjectTermDTO {
  @ApiProperty()
  id: string;
  @ApiProperty()
  value: string;
  @ApiProperty({
    nullable: true,
  })
  context: string | null;
  @ApiProperty()
  date: AccessDatesDTO;
}

export class ProjectStatsDTO {
  @ApiProperty()
  progress: number;
  @ApiProperty()
  translated: number;
  @ApiProperty()
  total: number;
  @ApiProperty()
  terms: number;
  @ApiProperty()
  locales: number;
}

export class ProjectLocaleStatsDTO {
  @ApiProperty()
  progress: number;
  @ApiProperty()
  translated: number;
  @ApiProperty()
  total: number;
}

export class GetProjectStatsDTO {
  @ApiProperty()
  projectStats: ProjectStatsDTO;
  @ApiProperty()
  localeStats: { [localeCode: string]: ProjectLocaleStatsDTO };
}

export class ProjectLocaleDTO {
  @ApiProperty()
  id: string;
  @ApiProperty()
  locale: LocaleDTO;
  @ApiProperty()
  date: AccessDatesDTO;
}

export class TermTranslationDTO {
  @ApiProperty()
  termId: string;
  @ApiProperty()
  value: string;
  @ApiProperty()
  date: AccessDatesDTO;
}

export class ProjectClientDTO {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ enum: ProjectRole })
  role: ProjectRole;
}

export class ProjectClientWithSecretDTO {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ enum: ProjectRole })
  role: ProjectRole;
  @ApiProperty()
  secret: string;
}

export abstract class ServiceApiResponse<A> {
  abstract get data(): A;
}

export class ListProjectClientsResponse extends ServiceApiResponse<ProjectClientDTO[]> {
  @ApiProperty({ type: ProjectClientDTO, isArray: true })
  data: ProjectClientDTO[];
}

export class ProjectClientResponse extends ServiceApiResponse<ProjectClientDTO> {
  @ApiProperty()
  data: ProjectClientDTO;
}

export class ProjectClientWithSecretResponse extends ServiceApiResponse<ProjectClientWithSecretDTO> {
  @ApiProperty()
  data: ProjectClientWithSecretDTO;
}

export class ProjectStatsResponse extends ServiceApiResponse<GetProjectStatsDTO> {
  @ApiProperty()
  data: GetProjectStatsDTO;
}

export class ImportResponse extends ServiceApiResponse<ImportFileDTO> {
  @ApiProperty()
  data: ImportFileDTO;
}

export class UserInfoResponse extends ServiceApiResponse<UserInfoDTO> {
  @ApiProperty()
  data: UserInfoDTO;
}

export class ProjectResponse extends ServiceApiResponse<ProjectDTO> {
  @ApiProperty()
  data: ProjectDTO;
}

export class ProjectPlanResponse extends ServiceApiResponse<ProjectPlanDTO> {
  @ApiProperty()
  data: ProjectPlanDTO;
}

export class ListTermTranslatonsResponse extends ServiceApiResponse<TermTranslationDTO[]> {
  @ApiProperty({ type: TermTranslationDTO, isArray: true })
  data: TermTranslationDTO[];
}

export class TermTranslatonResponse extends ServiceApiResponse<TermTranslationDTO> {
  @ApiProperty()
  data: TermTranslationDTO;
}

export class ListProjectsResponse extends ServiceApiResponse<ProjectDTO[]> {
  @ApiProperty({ type: ProjectDTO, isArray: true })
  data: ProjectDTO[];
}

export class ListProjectLocalesResponse extends ServiceApiResponse<ProjectLocaleDTO[]> {
  @ApiProperty({ type: ProjectLocaleDTO, isArray: true })
  data: ProjectLocaleDTO[];
}

export class ProjectLocaleResponse extends ServiceApiResponse<ProjectLocaleDTO> {
  @ApiProperty()
  data: ProjectLocaleDTO;
}

export class ProjectTermResponse extends ServiceApiResponse<ProjectTermDTO> {
  @ApiProperty()
  data: ProjectTermDTO;
}

export class ListProjectTermsResponse extends ServiceApiResponse<ProjectTermDTO[]> {
  @ApiProperty({ type: ProjectTermDTO, isArray: true })
  data: ProjectTermDTO[];
}

export class ListLocalesResponse extends ServiceApiResponse<LocaleDTO[]> {
  @ApiProperty({ type: LocaleDTO, isArray: true })
  data: LocaleDTO[];
}

export class ListProjectUsersResponse extends ServiceApiResponse<ProjectUserDTO[]> {
  @ApiProperty({ type: ProjectUserDTO, isArray: true })
  data: ProjectUserDTO[];
}

export class ProjectUserResponse extends ServiceApiResponse<ProjectUserDTO> {
  @ApiProperty()
  data: ProjectUserDTO;
}

export class AuthenticateRequest {
  @ApiProperty({ enum: GrantType })
  @IsEnum(GrantType)
  grant_type: GrantType;

  // username & password
  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  username: string;

  @ApiPropertyOptional({ minLength: 8, maxLength: 255 })
  @Length(8, 255)
  @IsOptional()
  password: string;

  // client credentials
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  client_id: string;

  @Length(8, 255)
  @ApiPropertyOptional({ minLength: 8, maxLength: 255 })
  @IsOptional()
  client_secret: string;
}

export class UpdateProjectUserRequest {
  @ApiProperty({ enum: ProjectRole })
  @IsEnum(ProjectRole)
  role: ProjectRole;
}

export class AddProjectUserRequest {
  @ApiProperty({ description: 'Email of the member; an account is created for it if it does not exist yet' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ProjectRole })
  @IsEnum(ProjectRole)
  role: ProjectRole;
}

export class AddProjectClientRequest {
  @IsString()
  @Length(1, 255)
  @ApiProperty({ minLength: 1, maxLength: 255 })
  name: string;

  @ApiProperty({ enum: ProjectRole })
  @IsEnum(ProjectRole)
  role: ProjectRole;
}

export class UpdateProjectClientRequest {
  @ApiProperty({ enum: ProjectRole })
  @IsEnum(ProjectRole)
  role: ProjectRole;
}

export class UpdateUserDataRequest {
  @Length(2, 255)
  @ApiPropertyOptional({ minLength: 2, maxLength: 255 })
  @Validate(IsNotOnlyWhitespace)
  @IsOptional()
  name?: string;
}

/** 邮箱登录：只需要邮箱，不需要密码 */
export class EmailLoginRequest {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class CreateProjectRequest {
  @Length(1, 255)
  @ApiProperty({ minLength: 1, maxLength: 255 })
  @Validate(IsNotOnlyWhitespace)
  name: string;

  @IsOptional()
  @Length(0, 255)
  @ApiPropertyOptional({ minLength: 0, maxLength: 255 })
  description: string;
}

export class UpdateProjectRequest {
  @ApiPropertyOptional({ minLength: 1, maxLength: 255 })
  @IsOptional()
  @Length(1, 255)
  @Validate(IsNotOnlyWhitespace)
  name: string | undefined;

  @ApiPropertyOptional({ minLength: 0, maxLength: 255 })
  @IsOptional()
  @Length(0, 255)
  description: string | undefined;
}

export class AddTermRequest {
  @ApiProperty({ minLength: 1, maxLength: 255 })
  @Length(1, 255)
  @Validate(IsNotOnlyWhitespace)
  value: string;

  @ApiPropertyOptional({ minLength: 0, maxLength: 1000 })
  @IsOptional()
  @Length(0, 1000)
  context: string | undefined;
}

export class UpdateTermRequest {
  @ApiProperty({ minLength: 1, maxLength: 255 })
  @Length(1, 255)
  @Validate(IsNotOnlyWhitespace)
  value: string;

  @ApiPropertyOptional({ minLength: 0, maxLength: 1000 })
  @IsOptional()
  @Length(0, 1000)
  context: string | undefined;
}

export class AddLocaleRequest {
  @ApiProperty({ minLength: 2, maxLength: 16 })
  @Length(2, 16)
  code: string;
}

export class UpdateTranslationRequest {
  @IsNotEmpty()
  @ApiProperty()
  termId: string;

  @Length(0, 8192)
  @ApiProperty({ minLength: 0, maxLength: 8192 })
  value: string;
}

export class ConfirmTranslationItem {
  @IsNotEmpty()
  @ApiProperty()
  termId: string;

  /** 开发在界面上看到的值。服务端发现当前值已被运营改过，就跳过这条，避免确认了没看过的内容。 */
  @Length(0, 8192)
  @ApiProperty({ minLength: 0, maxLength: 8192 })
  value: string;
}

export class ConfirmTranslationsRequest {
  @IsArray()
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => ConfirmTranslationItem)
  @ApiProperty({ type: [ConfirmTranslationItem] })
  items: ConfirmTranslationItem[];
}

export enum ImportExportFormat {
  AndroidXml = 'androidxml',
  Csv = 'csv',
  Xliff12 = 'xliff12',
  JsonFlat = 'jsonflat',
  JsonNested = 'jsonnested',
  YamlFlat = 'yamlflat',
  YamlNested = 'yamlnested',
  Properties = 'properties',
  Gettext = 'po',
  Strings = 'strings',
  Php = 'php',
  ResX = 'resx',
}

export class ExportQuery {
  @Length(2, 16)
  @ApiProperty({ minLength: 2, maxLength: 16 })
  locale: string;

  @Length(2, 16)
  @ApiProperty({ minLength: 2, maxLength: 16 })
  @IsOptional()
  fallbackLocale: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiProperty()
  @IsOptional()
  untranslated: boolean;

  @IsEnum(ImportExportFormat)
  @ApiProperty({ enum: ImportExportFormat })
  format: ImportExportFormat;
}

export class ImportQuery {
  @Length(2, 16)
  @ApiProperty({ minLength: 2, maxLength: 16 })
  locale: string;

  @IsEnum(ImportExportFormat)
  @ApiProperty({ enum: ImportExportFormat })
  format: ImportExportFormat;
}

