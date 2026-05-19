import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      });

      if (publicRole) {
        const actionsToEnable = [
          'api::projekat.projekat.find',
          'api::projekat.projekat.findOne',
          'api::nastavnik.nastavnik.find',
          'api::nastavnik.nastavnik.findOne',
        ];

        for (const action of actionsToEnable) {
          const perm = await strapi.db.query('plugin::users-permissions.permission').findOne({
            where: {
              role: publicRole.id,
              action: action,
            },
          });

          if (perm) {
            await strapi.db.query('plugin::users-permissions.permission').update({
              where: { id: perm.id },
              data: { enabled: true },
            });
            strapi.log.info(`[Bootstrap] Enabled Public permission for: ${action}`);
          } else {
            await strapi.db.query('plugin::users-permissions.permission').create({
              data: {
                action,
                enabled: true,
                role: publicRole.id,
              },
            });
            strapi.log.info(`[Bootstrap] Created and Enabled Public permission for: ${action}`);
          }
        }
      }
    } catch (err) {
      strapi.log.error('[Bootstrap] Error setting public permissions:', err);
    }
  },
};

