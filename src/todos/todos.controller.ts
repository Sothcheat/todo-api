import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { TodosService } from './todos.service.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { CurrentUser, type AuthUser } from '../auth/auth.decorators.js';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(user, createTodoDto);
  }

  // GET /todos lists your own; an admin can add ?userId=<id> for someone else's.
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('userId', new ParseUUIDPipe({ optional: true })) userId?: string,
  ) {
    return this.todosService.findAll(user, userId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.todosService.findOne(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todosService.update(user, id, updateTodoDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.todosService.remove(user, id);
  }
}
