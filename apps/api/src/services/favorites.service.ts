import { prisma } from '../lib/prisma';

/**
 * Service de gestion des équipes favorites des utilisateurs
 */
class FavoritesService {
  /**
   * Ajouter une équipe aux favoris d'un utilisateur
   */
  async addFavoriteTeam(userId: string, teamId: string): Promise<void> {
    // Vérifier que l'équipe existe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Ajouter aux favoris (upsert pour éviter les doublons)
    await prisma.userFavoriteTeam.upsert({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      create: {
        userId,
        teamId,
      },
      update: {}, // Ne rien faire si déjà existant
    });
  }

  /**
   * Retirer une équipe des favoris d'un utilisateur
   */
  async removeFavoriteTeam(userId: string, teamId: string): Promise<void> {
    await prisma.userFavoriteTeam.deleteMany({
      where: {
        userId,
        teamId,
      },
    });
  }

  /**
   * Récupérer toutes les équipes favorites d'un utilisateur
   */
  async getUserFavoriteTeams(userId: string, options?: {
    page?: number;
    limit?: number;
  }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.userFavoriteTeam.findMany({
        where: { userId },
        include: {
          team: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.userFavoriteTeam.count({
        where: { userId },
      }),
    ]);

    return {
      teams: favorites.map((f) => f.team),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Vérifier si une équipe est dans les favoris d'un utilisateur
   */
  async isFavoriteTeam(userId: string, teamId: string): Promise<boolean> {
    const favorite = await prisma.userFavoriteTeam.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    return !!favorite;
  }

  /**
   * Récupérer les IDs des équipes favorites d'un utilisateur
   * (utile pour marquer les favoris dans une liste)
   */
  async getUserFavoriteTeamIds(userId: string): Promise<string[]> {
    const favorites = await prisma.userFavoriteTeam.findMany({
      where: { userId },
      select: { teamId: true },
    });

    return favorites.map((f) => f.teamId);
  }

  /**
   * Compter le nombre de favoris d'un utilisateur
   */
  async countUserFavorites(userId: string): Promise<number> {
    return prisma.userFavoriteTeam.count({
      where: { userId },
    });
  }
}

export const favoritesService = new FavoritesService();
