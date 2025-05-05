module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: {
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
            },
        }],
    },
    moduleNameMapper: {
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@entities/(.*)$': '<rootDir>/src/entities/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
}; 