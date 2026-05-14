import { api } from "./api";

import { UserStats, UserWithStats } from "@/types/stats";

export const profileService = {
	async getProfile(): Promise<UserWithStats> {
		const userResponse = await api.get('/auth/me');
		const user = userResponse.data.user;

		const statsResponse = await api.get<{ data: UserStats }>(`/stats/user/${user.id}`);
		const stats = statsResponse.data.data;

		return {
			user,
			stats,
		}
	}
}
