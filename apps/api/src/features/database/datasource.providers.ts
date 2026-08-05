import { AppDataSource } from './datasource';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      return await AppDataSource.initialize();
    },
  },
];
