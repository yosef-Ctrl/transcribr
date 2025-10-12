import { useNameQuery } from "~/hooks/queries/useNameQuery";

const SHOW_HAMBURGER = true;

export const NavBar = () => {
	const { data } = useNameQuery();

	return (
		<div className="navbar">
			<div className="navbar-start">
				<div className="flex items-center gap-2">
					{data?.name ?? "Loading..."}
				</div>
			</div>

			<div className="navbar-end">
				<div className="flex gap-8 items-center">
					{SHOW_HAMBURGER && (
						<button
							type="button"
							className="btn btn-ghost"
							onClick={() =>
								window.open(
									"https://github.com/artlu99/transcribr",
									"_blank",
									"noopener,noreferrer",
								)
							}
						>
							<i className="ri-github-line" />
						</button>
					)}{" "}
				</div>
			</div>
		</div>
	);
};
