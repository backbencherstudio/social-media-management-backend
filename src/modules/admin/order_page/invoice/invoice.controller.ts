// invoice.controller.ts
import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { OrderPageService } from './../order_page.service'; // import your real order service

@Controller('invoice')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly OrderPageService: OrderPageService,
  ) {}

  @Get(':id')
  async getInvoice(@Param('id') id: string, @Res() res: Response) {
    const order = await this.OrderPageService.getOneOrder(id);
    console.log('📩 Invoice ready'); 

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const pdf = await this.invoiceService.generateInvoice(order);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${id}.pdf`,
    });

    res.send(pdf);
  }
}
