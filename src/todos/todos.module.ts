import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosService } from './todos.service.js';
import { TodosController } from './todos.controller.js';
import { AdminTodosController } from './admin-todos.controller.js';
import { Todo } from './entities/todo.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Todo])],
  controllers: [TodosController, AdminTodosController],
  providers: [TodosService],
})
export class TodosModule {}
