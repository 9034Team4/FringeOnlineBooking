// src/swagger.ts

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fringe 2025 Online Booking API ',
      version: '1.0.0',
      description: 'API documentation for Fringe 2025 booking system',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // Optional: just for display
        },
      },
    },
    security: [
      {
        bearerAuth: [], // Apply globally unless overridden
      },
    ],
  },
  apis: ['./src/routes.ts', './src/controllers/**/*.ts'], // Make sure path is correct!
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
