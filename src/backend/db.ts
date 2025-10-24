import type { iTunesResult } from "@shared/types";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import invariant from "tiny-invariant";

interface CfD1 {
	items: {
		episode_url: string; // this is a primary key
		podcast_name: string;
		episode_name: string;
		published_date: string;
		description: string;
		preview_image_url: string;
		audio_url: string;
	};
}

const db = (env: Env) =>
	new Kysely<CfD1>({ dialect: new D1Dialect({ database: env.D1 }) });

export const getEpisode = async (env: Env, episodeUrl: string): Promise<iTunesResult | undefined> => {
	const res =  await db(env).selectFrom("items").where("episode_url", "=", episodeUrl).selectAll().executeTakeFirst();
	return res ? {
		trackId: 0,
		collectionName: res.podcast_name,
		trackName: res.episode_name,
		releaseDate: res.published_date,
		description: res.description,
		artworkUrl600: res.preview_image_url,
		episodeUrl: res.episode_url,
	} : undefined;
};

export const saveAsSeen = async (env: Env, episodeUrl: string, iTunesResult: iTunesResult) => {
    invariant(iTunesResult.episodeUrl, "Episode URL is required");
    await db(env)
		.insertInto("items")
		.values({
			episode_url: episodeUrl,
			podcast_name: iTunesResult.collectionName,
			episode_name: iTunesResult.trackName,
			published_date: iTunesResult.releaseDate,
			description: iTunesResult.description,
			preview_image_url: iTunesResult.artworkUrl600 ?? "",
			audio_url: iTunesResult.episodeUrl,
		})
		.onConflict((oc) =>
			oc
				.column("episode_url")
				.doUpdateSet((eb) => ({
					podcast_name: eb.ref("excluded.podcast_name"),
					episode_name: eb.ref("excluded.episode_name"),
					published_date: eb.ref("excluded.published_date"),
					description: eb.ref("excluded.description"),
					preview_image_url: eb.ref("excluded.preview_image_url"),
					audio_url: eb.ref("excluded.audio_url"),
				}))
		)
		.execute();
};