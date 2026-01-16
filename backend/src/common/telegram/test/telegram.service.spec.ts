import { Test, TestingModule } from '@nestjs/testing';
import { TelegramService } from '../telegram.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

// Mock globals for Jest environment
global.Blob = class Blob {
  constructor(content: any[], options: any) {}
} as any;

global.FormData = class FormData {
  append(key: string, value: any, filename?: string) {}
} as any;


describe('TelegramService', () => {
  let service: TelegramService;
  let mockHttpService: jest.Mocked<HttpService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
      axiosRef: {
        get: jest.fn(),
      }
    } as any;

    mockConfigService = {
      get: jest.fn((key: string) => {
        return 'TEST_TOKEN';
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send a text message successfully', async () => {
      const response: AxiosResponse = {
        data: { ok: true, result: { message_id: 123 } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(response));

      await service.sendMessage('12345', 'Hello World');

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.telegram.org/botTEST_TOKEN/sendMessage',
        { chat_id: '12345', text: 'Hello World' }
      );
    });

    it('should handle errors', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('API Error')));

      await expect(service.sendMessage('12345', 'Fail')).rejects.toThrow('API Error');
    });
  });

  describe('sendDocument', () => {
    it('should send a document with caption', async () => {
      const buffer = Buffer.from('test pdf content');
      const response: AxiosResponse = {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(response));

      await service.sendDocument('12345', buffer, 'test.pdf', 'My Caption');

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.telegram.org/botTEST_TOKEN/sendDocument',
        expect.any(FormData)
      );
    });
  });
});
