package me.rhin.openciv.ui.screen;

import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.ui.screen.type.LoadingScreen;
import me.rhin.openciv.ui.screen.type.ServerLobbyScreen;
import me.rhin.openciv.ui.screen.type.ServerSelectScreen;
import me.rhin.openciv.ui.screen.type.TitleScreen;

public enum ScreenEnum {
	LOADING {
		public AbstractScreen getScreen() {
			return new LoadingScreen();
		}
	},
	TITLE {
		public AbstractScreen getScreen() {
			return new TitleScreen();
		}
	},
	SERVER_SELECT {
		public AbstractScreen getScreen() {
			return new ServerSelectScreen();
		}
	},
	SERVER_LOBBY {
		public AbstractScreen getScreen() {
			return new ServerLobbyScreen();
		}
	},
	IN_GAME {
		public AbstractScreen getScreen() {
			return new InGameScreen();
		}
	};

	public abstract AbstractScreen getScreen();
}
