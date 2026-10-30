import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './entities/todo.entity.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import type { AuthUser } from '../auth/auth.decorators.js';

// Ownership: a user may only touch their own todos; an admin may touch anyone's.
// Queries add this filter, so someone else's todo is reported as not found
// rather than forbidden, and its existence doesn't leak.
const ownedBy = (user: AuthUser) =>
  user.role === 'admin' ? {} : { userId: user.id };

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly repo: Repository<Todo>,
  ) {}

  create(user: AuthUser, createTodoDto: CreateTodoDto) {
    const todo = this.repo.create(createTodoDto);
    todo.userId = user.id;
    return this.repo.save(todo);
  }

  // Lists ownerId's todos, which defaults to your own. Only an admin may ask
  // for someone else's.
  // UUIDs are random, so order by createdAt to keep todos in the order they were added.
  findAll(user: AuthUser, ownerId = user.id) {
    if (ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only list your own todos');
    }
    return this.repo.find({
      where: { userId: ownerId },
      order: { createdAt: 'ASC' },
    });
  }

  // Every user's todos, with who owns each. Only reachable through
  // GET /admin/todos, which is limited to admins.
  findEveryones() {
    return this.repo.find({
      relations: { user: true },
      select: { user: { id: true, username: true } },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const todo = await this.repo.findOneBy({ id, ...ownedBy(user) });
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return todo;
  }

  async update(user: AuthUser, id: string, updateTodoDto: UpdateTodoDto) {
    const todo = await this.findOne(user, id);
    return this.repo.save(this.repo.merge(todo, updateTodoDto));
  }

  async remove(user: AuthUser, id: string) {
    const result = await this.repo.delete({ id, ...ownedBy(user) });
    if (!result.affected) throw new NotFoundException(`Todo ${id} not found`);
  }
}
