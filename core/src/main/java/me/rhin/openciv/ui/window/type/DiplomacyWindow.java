package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.type.ListDiplomacyCivilization;
import me.rhin.openciv.ui.window.AbstractWindow;

public class DiplomacyWindow extends AbstractWindow implements ResizeListener {

	private ColoredBackground background;
	private CloseWindowButton closeWindowButton;
	private CustomLabel diplomacyDescLabel;
	private CustomLabel noDiscoveredCivsLabel;
	private ContainerList civilizationList;
	private ContainerList cityStateList;

	public DiplomacyWindow() {
		setBounds(viewport.getWorldWidth() / 2 - 600 / 2, viewport.getWorldHeight() / 2 - 600 / 2, 600, 600);

		this.background = new ColoredBackground(TextureEnum.UI_GRAY.sprite(), 0, 0, getWidth(), getHeight());
		addActor(background);

		this.closeWindowButton = new CloseWindowButton(getClass(), "Close", getWidth() / 2 - 135 / 2, 20, 135, 35);
		addActor(closeWindowButton);

		this.diplomacyDescLabel = new CustomLabel("Diplomacy Overview", Align.center, 0, getHeight() - 15, getWidth(),
				15);
		addActor(diplomacyDescLabel);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);

		Player player = Civilization.getInstance().getGame().getPlayer();

		player.unselectUnit();
		
		if (player.getDiplomacy().getDiscoveredPlayers().size() < 1) {

			this.noDiscoveredCivsLabel = new CustomLabel("You have not discovered\nany civilizations.");
			noDiscoveredCivsLabel.setPosition(35, getHeight() / 2);
			addActor(noDiscoveredCivsLabel);

			return;
		}

		this.civilizationList = new ContainerList(25, getHeight() - 450, 270, 400);
		addActor(civilizationList);

		for (AbstractPlayer discoveredPlayer : player.getDiplomacy().getDiscoveredPlayers()) {
			civilizationList.addItem(ListContainerType.CATEGORY, "Civilizations",
					new ListDiplomacyCivilization(discoveredPlayer, civilizationList, 250, 55));
		}
	}

	@Override
	public void onResize(int width, int height) {
		setPosition(width / 2 - 600 / 2, height / 2 - 600 / 2);
	}

	@Override
	public boolean disablesInput() {
		return true;
	}

	@Override
	public boolean disablesCameraMovement() {
		return true;
	}

	@Override
	public boolean closesOtherWindows() {
		return true;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return true;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}
}
