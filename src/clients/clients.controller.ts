import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/decorators/permissions.decorator';
import { Resource } from '@/roles/enums/resource.enum';
import { Action } from '@/roles/enums/action.enum';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { ResponseDto } from '@/common/dto/response.dto';
import { AuthenticationGuard } from '@/guards/authentication.guard';
import { AuthorizationGuard } from '@/guards/authorization.guard';
import { Client } from '@/clients/entities/client.entity';
import { CreateClientDto } from '@/clients/dto/create-client.dto';
import { UpdateClientDto } from '@/clients/dto/update-client.dto';
import {
  CLIENTS_SERVICE,
  ClientsServiceInterface,
} from '@/clients/interfaces/clients-service.interface';
import {
  ApiCreateClient,
  ApiDeleteClient,
  ApiFindAllClients,
  ApiFindOneClient,
  ApiUpdateClient,
  ApiVerifyClientEmail,
} from '@/clients/decorators/clients-swagger.decorator';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(
    @Inject(CLIENTS_SERVICE)
    private readonly clientsService: ClientsServiceInterface,
  ) {}

  @ApiFindAllClients()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.CLIENTS, actions: [Action.READ] }])
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Client>> {
    return await this.clientsService.findAll(paginationParams);
  }

  @ApiFindOneClient()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.CLIENTS, actions: [Action.READ] }])
  @Get(':uuid')
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ResponseDto> {
    return await this.clientsService.find(uuid);
  }

  @ApiCreateClient()
  @Post('register')
  async register(
    @Body() createClientDto: CreateClientDto,
  ): Promise<ResponseDto> {
    return await this.clientsService.create(createClientDto);
  }

  @ApiVerifyClientEmail()
  @Get('verify-email/:token')
  async verifyEmail(
    @Param('token', ParseUUIDPipe) token: string,
  ): Promise<ResponseDto> {
    return await this.clientsService.verifyEmail(token);
  }

  @ApiUpdateClient()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.CLIENTS, actions: [Action.WRITE] }])
  @Put(':uuid')
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<ResponseDto> {
    return await this.clientsService.update(uuid, updateClientDto);
  }

  @ApiDeleteClient()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.CLIENTS, actions: [Action.ADMIN] }])
  @Delete(':uuid')
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ResponseDto> {
    return await this.clientsService.remove(uuid);
  }
}
