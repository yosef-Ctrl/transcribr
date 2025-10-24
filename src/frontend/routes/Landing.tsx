import { ApiInputs } from "~/components/ApiInputs";
import { JobsQueue } from "~/components/JobsQueue";
import { PodcastTranscript } from "~/components/PodcastTranscript";
import { PodcastUpload } from "~/components/PodcastUpload";

export const Landing = () => {
	return (
		<div className="flex justify-center">
			<article className="prose dark:prose-invert">
				<div className="flex flex-col gap-4">
					<PodcastUpload />
					<PodcastTranscript />
					<JobsQueue />
					<ApiInputs />
				</div>
			</article>
		</div>
	);
};
