import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './entities/todo.entity.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';

// Every query filters by userId, so a user only ever sees their own todos.
// Someone else's todo is reported as not found rather than forbidden.
@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly repo: Repository<Todo>,
  ) {}

  create(userId: string, createTodoDto: CreateTodoDto) {
    const todo = this.repo.create(createTodoDto);
    todo.userId = userId;
    return this.repo.save(todo);
  }

  // UUIDs are random, so order by createdAt to keep todos in the order they were added.
  findAll(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  async findOne(userId: string, id: string) {
    const todo = await this.repo.findOneBy({ id, userId });
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return todo;
  }

  async update(userId: string, id: string, updateTodoDto: UpdateTodoDto) {
    const todo = await this.findOne(userId, id);
    return this.repo.save(this.repo.merge(todo, updateTodoDto));
  }

  async remove(userId: string, id: string) {
    const result = await this.repo.delete({ id, userId });
    if (!result.affected) throw new NotFoundException(`Todo ${id} not found`);
  }
}
