import { Injectable, Logger } from '@nestjs/common';
import chalk from 'chalk';
import type { User } from '../entity/user.entity';
import { UserService } from '../services/user.service';
import { config } from '../config';

/**
 * Seed service for creating default users
 */
@Injectable()
export class UserSeed {
  private readonly logger = new Logger(UserSeed.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Creates default admin user if it doesn't exist
   */
  async createDefaultAdmin(): Promise<User | null> {
    if (
      !config.defaultAdminCredentialConfig ||
      !config.defaultAdminCredentialConfig.adminEmail ||
      !config.defaultAdminCredentialConfig.adminPassword
    ) {
      this.logger.log(chalk.yellow('ℹ️ TR_ADMIN_PASSWORD is not set. Skipping admin creation.'));
      return null;
    }

    const { adminEmail, adminPassword, adminName } = config.defaultAdminCredentialConfig;

    try {
      // Check if admin user already exists
      const adminExists = await this.userService.userExists(adminEmail);

      if (adminExists) {
        // 这个邮箱之前被当作普通成员加过（没有密码）：把它升级为用密码登录的管理员
        if (await this.userService.setMissingPassword(adminEmail, adminPassword)) {
          this.logger.log(chalk.green(`✅ Default admin user had no password, set it from TR_ADMIN_PASSWORD: ${chalk.blue(adminEmail)}`));
        } else {
          this.logger.log(chalk.yellow(`ℹ️ Default admin user already exists. Skipping creation.`));
        }
        return null;
      }

      // Create admin user
      const user = await this.userService.createWithPassword({ email: adminEmail, name: adminName, password: adminPassword });
      this.logger.log(chalk.green(`✅ Default admin user created successfully: ${chalk.blue(adminEmail)}`));
      return user;
    } catch (error) {
      this.logger.error(chalk.red(`❌ Failed to create default admin user: ${error.message}`), error.stack);
      throw error;
    }
  }

  /**
   * Main seed method that orchestrates the user seeding process
   */
  async seed(): Promise<void> {
    try {
      this.logger.log(chalk.blue('Starting user seeding...'));

      // Create default admin user
      await this.createDefaultAdmin();

      this.logger.log(chalk.green('✅ User seeding completed successfully'));
    } catch (error) {
      this.logger.error(chalk.red(`❌ User seeding failed: ${error.message}`), error.stack);
      throw error;
    }
  }
}
