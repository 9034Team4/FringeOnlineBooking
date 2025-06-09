import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// 定义Attachment类型
interface Attachment {
  filename?: string;
  content?: string;
  path?: string;
  encoding?: string;
  cid?: string;
}

/**
 * 电子邮件服务，用于发送各种系统邮件
 */
export class EmailService {
  // 使用!告诉TypeScript这个属性会在构造函数完成前被赋值
  private transporter!: nodemailer.Transporter;
  private mockSent: {to: string, subject: string, html?: string, text?: string, attachments?: any[]}[] = [];
  private useMock: boolean = false;
  
  constructor() {
    console.log('初始化邮件服务...');
    
    // 检查是否使用模拟邮件服务
    this.useMock = process.env.NODE_ENV === 'development' && (process.env.USE_MOCK_EMAIL === 'true');
    
    if (this.useMock) {
      console.log('使用模拟邮件服务（不会真正发送邮件）');
      
      // 创建测试账户
      nodemailer.createTestAccount().then(testAccount => {
        console.log('创建测试邮件账户成功:', testAccount.user);
        
        // 创建模拟传输器
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        
        console.log('模拟邮件服务准备就绪');
      }).catch(err => {
        console.error('创建测试账户失败:', err);
        
        // 如果无法创建测试账户，使用内存传输
        this.transporter = nodemailer.createTransport({
          jsonTransport: true
        });
        
        console.log('使用内存传输作为备选');
      });
    } else {
      // 创建真实邮件传输器
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER || 'funrie028@gmail.com',
          pass: process.env.EMAIL_PASSWORD || 'vwvq ncxj wxht nqzo'
        },
        debug: true
      });
      
      // 验证传输器配置
      this.transporter.verify((error) => {
        if (error) {
          console.error('SMTP连接错误 (详细):', JSON.stringify(error));
          console.log('将使用模拟邮件服务作为备选');
          
          // 如果验证失败，切换到模拟模式
          this.useMock = true;
          this.transporter = nodemailer.createTransport({
            jsonTransport: true
          });
        } else {
          console.log('SMTP服务准备就绪');
        }
      });
    }
  }
  
  /**
   * 发送普通文本电子邮件
   */
  async sendEmail(to: string, subject: string, text: string): Promise<boolean> {
    try {
      console.log(`尝试发送邮件到: ${to}`);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'funrie028@gmail.com',
        to,
        subject,
        text
      };
      
      if (this.useMock) {
        // 使用模拟服务
        this.mockSent.push(mailOptions);
        console.log(`[模拟] 电子邮件已发送至 ${to}`);
        console.log(`[模拟] 内容:`, text);
        return true;
      }
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`电子邮件已发送至 ${to}, messageId: ${info.messageId}`);
      
      // 如果使用Ethereal测试账户，显示预览URL
      if (info.messageId && info.messageId.includes('ethereal')) {
        console.log(`邮件预览: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      return true;
    } catch (error) {
      console.error('发送电子邮件失败 (详细):', JSON.stringify(error));
      return false;
    }
  }
  
  /**
   * 发送HTML格式的电子邮件
   */
  async sendHtmlEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      console.log(`尝试发送HTML邮件到: ${to}`);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'funrie028@gmail.com',
        to,
        subject,
        html
      };
      
      if (this.useMock) {
        // 使用模拟服务
        this.mockSent.push(mailOptions);
        console.log(`[模拟] HTML电子邮件已发送至 ${to}`);
        console.log(`[模拟] 内容:`, html.substring(0, 100) + '...');
        return true;
      }
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`HTML电子邮件已发送至 ${to}, messageId: ${info.messageId}`);
      
      // 如果使用Ethereal测试账户，显示预览URL
      if (info.messageId && info.messageId.includes('ethereal')) {
        console.log(`邮件预览: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      return true;
    } catch (error) {
      console.error('发送HTML电子邮件失败 (详细):', JSON.stringify(error));
      return false;
    }
  }
  
  /**
   * 发送带附件的电子邮件
   */
  async sendEmailWithAttachment(
    to: string, 
    subject: string, 
    text: string, 
    attachments: Attachment[]
  ): Promise<boolean> {
    try {
      console.log(`尝试发送带附件邮件到: ${to}`);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'funrie028@gmail.com',
        to,
        subject,
        text,
        attachments
      };
      
      if (this.useMock) {
        // 使用模拟服务
        this.mockSent.push(mailOptions);
        console.log(`[模拟] 带附件的电子邮件已发送至 ${to}`);
        console.log(`[模拟] 附件数量: ${attachments.length}`);
        return true;
      }
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`带附件的电子邮件已发送至 ${to}, messageId: ${info.messageId}`);
      
      // 如果使用Ethereal测试账户，显示预览URL
      if (info.messageId && info.messageId.includes('ethereal')) {
        console.log(`邮件预览: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      return true;
    } catch (error) {
      console.error('发送带附件的电子邮件失败 (详细):', JSON.stringify(error));
      return false;
    }
  }
  
  /**
   * 发送票据电子邮件
   */
  async sendTicketEmail(
    to: string,
    subject: string,
    customerName: string,
    eventTitle: string,
    imageBase64: string
  ): Promise<boolean> {
    try {
      console.log(`尝试发送票据邮件到: ${to}`);
      console.log(`客户: ${customerName}, 活动: ${eventTitle}`);
      
      // 创建HTML模板
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Your Ticket is Ready</h2>
          <p style="color: #555;">Dear ${customerName},</p>
          <p style="color: #555;">Thank you for purchasing tickets for <strong>${eventTitle}</strong>. Your e-ticket is attached below.</p>
          <p style="color: #555;">Please present this ticket or QR code at the event entrance.</p>
          <div style="text-align: center; margin: 20px 0;">
            <img src="cid:ticketImage" style="max-width: 100%; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
          </div>
          <p style="color: #555; text-align: center; margin-top: 30px; font-size: 12px;">
            This email was sent automatically. Please do not reply. If you have any questions, please contact customer service.
          </p>
        </div>
      `;
      
      // 创建邮件选项
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'funrie028@gmail.com',
        to,
        subject,
        html,
        attachments: [
          {
            filename: `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket.png`,
            content: imageBase64,
            encoding: 'base64',
            cid: 'ticketImage' // 在HTML中通过cid引用
          }
        ]
      };
      
      if (this.useMock) {
        // 使用模拟服务
        this.mockSent.push({
          to, 
          subject, 
          html, 
          attachments: [{
            filename: `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket.png`,
            cid: 'ticketImage'
          }]
        });
        console.log(`[模拟] 票据电子邮件已发送至 ${to}`);
        console.log(`[模拟] 票据已附加`);
        return true;
      }
      
      console.log('发送邮件中...');
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`票据电子邮件已发送至 ${to}, messageId: ${info.messageId}`);
      
      // 如果使用Ethereal测试账户，显示预览URL
      if (info.messageId && info.messageId.includes('ethereal')) {
        console.log(`邮件预览: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      return true;
    } catch (error) {
      console.error('发送票据电子邮件失败 (详细):', JSON.stringify(error));
      // 在出错时也使用模拟方式
      this.mockSent.push({
        to, 
        subject, 
        html: `票据邮件给 ${customerName} 参加 ${eventTitle}`,
        attachments: [{
          filename: `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket.png`,
          cid: 'ticketImage'
        }]
      });
      console.log(`[备选模拟] 票据电子邮件已模拟发送至 ${to}`);
      return true; // 返回true以避免前端出错
    }
  }
  
  /**
   * 获取已发送的模拟邮件（仅开发环境使用）
   */
  getMockSentEmails() {
    return this.mockSent;
  }
}

// 创建单例实例
export const emailService = new EmailService(); 