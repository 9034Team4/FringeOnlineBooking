import { Request, Response } from 'express';
import { TicketService } from '../../services/TicketService';
import { TicketType } from '../../entities/Ticket';

export class TicketController {
    private ticketService: TicketService;

    constructor() {
        this.ticketService = new TicketService();
    }

    async bookTicket(req: Request, res: Response) {
        try {
            const { eventId, ticketType, seatNumber, section } = req.body;
            const userId = req.user.id; // Assuming user is authenticated

            const ticket = await this.ticketService.createTicket(
                eventId,
                userId,
                ticketType as TicketType,
                seatNumber,
                section
            );

            res.status(201).json({
                success: true,
                data: ticket
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to book ticket'
            });
        }
    }

    async getTicketDetails(req: Request, res: Response) {
        try {
            const { ticketId } = req.params;
            const ticket = await this.ticketService.getTicketDetails(ticketId);

            res.status(200).json({
                success: true,
                data: ticket
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                error: error.message || 'Ticket not found'
            });
        }
    }

    async getUserTickets(req: Request, res: Response) {
        try {
            const userId = req.user.id; // Assuming user is authenticated
            const tickets = await this.ticketService.getUserTickets(userId);

            res.status(200).json({
                success: true,
                data: tickets
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to get user tickets'
            });
        }
    }

    async cancelTicket(req: Request, res: Response) {
        try {
            const { ticketId } = req.params;
            const { reason } = req.body;
            const userId = req.user.id; // Assuming user is authenticated

            const ticket = await this.ticketService.cancelTicket(ticketId, reason);

            res.status(200).json({
                success: true,
                data: ticket
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to cancel ticket'
            });
        }
    }

    async validateTicket(req: Request, res: Response) {
        try {
            const { ticketId } = req.params;
            const scannerId = req.user.id; // Assuming scanner is authenticated

            const isValid = await this.ticketService.validateTicket(ticketId, scannerId);

            res.status(200).json({
                success: true,
                data: { isValid }
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to validate ticket'
            });
        }
    }
} 