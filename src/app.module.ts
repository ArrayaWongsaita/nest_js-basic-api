import { DynamicModule, Module } from '@nestjs/common';
import { AppConfig } from './bootstrap/config/app-config';
import { AppConfigModule } from './bootstrap/config/app-config.module';
import { BookModule } from './contexts/book/book.module';
import { ContactModule } from './contexts/contact/contact.module';
import { ExpenseModule } from './contexts/expense/expense.module';
import { IamModule } from './contexts/iam/iam.module';
import { MovieModule } from './contexts/movie/movie.module';
import { SystemModule } from './contexts/system/system.module';
import { NoteModule } from './contexts/note/note.module';
import { TodoModule } from './contexts/todo/todo.module';

@Module({})
export class AppModule {
  static register(appConfig: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        AppConfigModule.register(appConfig),
        SystemModule,
        IamModule,
        TodoModule,
        NoteModule,
        ContactModule,
        BookModule,
        MovieModule,
        ExpenseModule,
      ],
    };
  }
}
