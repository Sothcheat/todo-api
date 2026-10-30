import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { AuthUser } from '../auth/auth.decorators.js';
import { Todo } from './entities/todo.entity.js';
import { TodosService } from './todos.service.js';

const alice: AuthUser = { id: 'alice-id', username: 'alice', role: 'user' };
const admin: AuthUser = { id: 'admin-id', username: 'admin', role: 'admin' };

describe('TodosService', () => {
  let service: TodosService;
  const repo = {
    find: vi.fn(),
    findOneBy: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        { provide: getRepositoryToken(Todo), useValue: repo },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);
  });

  describe('findAll', () => {
    it("lists the user's own todos by default", async () => {
      await service.findAll(alice);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: alice.id } }),
      );
    });

    it("forbids a user from listing someone else's todos", () => {
      expect(() => service.findAll(alice, admin.id)).toThrow(
        ForbiddenException,
      );
    });

    it("lets an admin list someone else's todos", async () => {
      await service.findAll(admin, alice.id);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: alice.id } }),
      );
    });
  });

  describe('findOne', () => {
    it('only looks among the todos a user owns', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(alice, 'todo-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.findOneBy).toHaveBeenCalledWith({
        id: 'todo-id',
        userId: alice.id,
      });
    });

    it('lets an admin find any todo', async () => {
      repo.findOneBy.mockResolvedValue({ id: 'todo-id', userId: alice.id });
      await service.findOne(admin, 'todo-id');
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'todo-id' });
    });
  });

  describe('remove', () => {
    it('only deletes a todo the user owns', async () => {
      repo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(alice, 'todo-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.delete).toHaveBeenCalledWith({
        id: 'todo-id',
        userId: alice.id,
      });
    });

    it('lets an admin delete any todo', async () => {
      repo.delete.mockResolvedValue({ affected: 1 });
      await service.remove(admin, 'todo-id');
      expect(repo.delete).toHaveBeenCalledWith({ id: 'todo-id' });
    });
  });
});
