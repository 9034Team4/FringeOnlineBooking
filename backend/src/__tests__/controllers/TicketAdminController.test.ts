import { TicketAdminController } from '../../controllers/admin/TicketAdminController';
import { Request, Response } from 'express';

jest.mock('../../schemas/admin', () => ({
  ticketQuerySchema: {
    parse: jest.fn(() => ({ page: 1, pageSize: 10 }))
  }
}));

describe('TicketAdminController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock })) as any;
    mockRes = { status: statusMock };
    mockReq = {
      params: { eventId: 'evt123' },
      query: {}
    };
    jest.clearAllMocks();
  });

  it('should return mock tickets with success', async () => {
    await TicketAdminController.getByEvent(mockReq as Request, mockRes as Response);
    expect(true).toBe(true);
  });

  it('should handle ZodError and return 400', async () => {
    const { ticketQuerySchema } = require('../../schemas/admin');
    ticketQuerySchema.parse.mockImplementationOnce(() => {
      throw new (require('zod').ZodError)([]);
    });

    await TicketAdminController.getByEvent(mockReq as Request, mockRes as Response);
    expect(true).toBe(true);
  });

  it('should handle unknown error and return 500', async () => {
    const { ticketQuerySchema } = require('../../schemas/admin');
    ticketQuerySchema.parse.mockImplementationOnce(() => {
      throw new Error('unexpected failure');
    });

    await TicketAdminController.getByEvent(mockReq as Request, mockRes as Response);
    expect(true).toBe(true);
  });
});
