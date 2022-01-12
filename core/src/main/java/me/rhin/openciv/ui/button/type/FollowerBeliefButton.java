package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.type.ListReligionBonus;
import me.rhin.openciv.ui.window.type.FoundReligionWindow;

public class FollowerBeliefButton extends Button {

	public FollowerBeliefButton(float x, float y, float width, float height) {
		super("Choose", x, y, width, height);
	}

	@Override
	public void onClick() {
		FoundReligionWindow window = (FoundReligionWindow) getParent();

		if (window.getBonusContianerList().hasParent()) {
			window.getBonusContianerList().clearList();
			window.removeActor(window.getBonusContianerList());
			// return;
		}

		for (ReligionBonus religionBonus : Civilization.getInstance().getGame().getAvailableReligionBonuses()
				.getAvailableFollowerBeliefs()) {
			window.getBonusContianerList().addItem(ListContainerType.CATEGORY, "Available Follower Beliefs",
					new ListReligionBonus(religionBonus, window.getBonusContianerList(),
							window.getBonusContianerList().getWidth() - 20, 70));
		}

		window.addActor(window.getBonusContianerList());
	}

}
