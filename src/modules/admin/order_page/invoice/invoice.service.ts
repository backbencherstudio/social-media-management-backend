import * as path from 'path';
import * as fs from 'fs';
import * as ejs from 'ejs';
import * as puppeteer from 'puppeteer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InvoiceService {
  async generateInvoice(order: any): Promise<Buffer> {
    const templatePath = path.resolve(process.cwd(), 'src/modules/admin/order_page/invoice/templates/invoice.ejs');

    const template = fs.readFileSync(templatePath, 'utf-8');
    const html = ejs.render(template, order);

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const buffer = await page.pdf({ format: 'A4' });
    await browser.close();
    return Buffer.from(buffer);
  }
}
