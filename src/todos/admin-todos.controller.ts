import { Controller, Get } from '@nestjs/common';
import { TodosService } from './todos.service.js';
import { Roles } from '../auth/auth.decorators.js';

// Admin-only view across all users. Everyone else gets 403 from RolesGuard.
@Roles('admin')
@Controller('admin/todos')
export class AdminTodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll() {
    return this.todosService.findEveryones();
  }
}
