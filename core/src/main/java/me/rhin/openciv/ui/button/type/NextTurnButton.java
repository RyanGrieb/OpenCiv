package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.notification.type.AvailableProductionNotification;
import me.rhin.openciv.game.notification.type.NotResearchingNotification;
import me.rhin.openciv.game.notification.type.NotStudyingNotification;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.NextTurnWindow;

public class NextTurnButton extends Button {

	public NextTurnButton(float x, float y, float width, float height) {
		super("Next Turn", x, y, width, height);
	}

	@Override
	public void onClick() {
		if (Civilization.getInstance().getGame().getNotificationHanlder()
				.isNotificationActive(AvailableProductionNotification.class)) {
			Civilization.getInstance().getWindowManager().getWindow(NextTurnWindow.class).notify("Chose a production item...");
		}

		if (Civilization.getInstance().getGame().getNotificationHanlder()
				.isNotificationActive(NotResearchingNotification.class)) {
			Civilization.getInstance().getWindowManager().getWindow(NextTurnWindow.class).notify("Choose a technology...");
		}
		
		if (Civilization.getInstance().getGame().getNotificationHanlder()
				.isNotificationActive(NotStudyingNotification.class)) {
			Civilization.getInstance().getWindowManager().getWindow(NextTurnWindow.class).notify("Choose a heritage...");
		}
		
		if(Civilization.getInstance().getWindowManager().getWindow(NextTurnWindow.class).getNotificationLabels().size() > 0)
			return;
		
		Civilization.getInstance().getGame().requestEndTurn();
	}
}
