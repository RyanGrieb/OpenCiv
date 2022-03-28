package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ReligionInfoWindow extends AbstractWindow {

	private ColoredBackground coloredBackground;
	private CustomLabel religionInfoDescLabel;
	private CloseWindowButton closeWindowButton;
	private CustomLabel noReligionLabel;
	private CustomLabel pantheonTitleLabel;
	private ColoredBackground pantheonIcon;
	private CustomLabel pantheonNameLabel;
	private CustomLabel pantheonDescLabel;
	private CustomLabel founderBeliefTitleLabel;
	private ColoredBackground founderBeliefIcon;
	private CustomLabel founderBeliefNameLabel;
	private CustomLabel founderBeliefDescLabel;
	private CustomLabel followerBeliefTitleLabel;
	private ColoredBackground followerBeliefIcon;
	private CustomLabel followerBeliefNameLabel;
	private CustomLabel followerBeliefDescLabel;
	private CustomLabel religionName;
	private ColoredBackground religionIcon;

	public ReligionInfoWindow() {
		setBounds(viewport.getWorldWidth() / 2 - 600 / 2, viewport.getWorldHeight() / 2 - 600 / 2, 600, 600);

		this.coloredBackground = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, getWidth(), getHeight());
		addActor(coloredBackground);

		this.religionInfoDescLabel = new CustomLabel("Religion Info", Align.center, 0, getHeight() - 15, getWidth(),
				15);
		addActor(religionInfoDescLabel);

		this.closeWindowButton = new CloseWindowButton(getClass(), "Close", getWidth() / 2 - 135 / 2, 15, 135, 35);
		addActor(closeWindowButton);

		this.noReligionLabel = new CustomLabel(
				"You have not founded a religion\nor pantheon. Research pottery &\nbuild a chapel.");
		noReligionLabel.setPosition(getWidth() / 2 - noReligionLabel.getWidth() / 2, getHeight() / 2 + 100);

		Player player = Civilization.getInstance().getGame().getPlayer();

		player.unselectUnit();

		if (player.getReligion().getPickedBonuses().size() < 1) {
			addActor(noReligionLabel);
			return;
		}

		this.pantheonTitleLabel = new CustomLabel("Pantheon: ");
		pantheonTitleLabel.setPosition(14, getHeight() - 75);
		addActor(pantheonTitleLabel);

		this.pantheonIcon = new ColoredBackground(player.getReligion().getPickedBonuses().get(0).getIcon().sprite(), 14,
				pantheonTitleLabel.getY() - 38, 32, 32);
		addActor(pantheonIcon);

		this.pantheonNameLabel = new CustomLabel(player.getReligion().getPickedBonuses().get(0).getName());
		pantheonNameLabel.setPosition(pantheonIcon.getX() + pantheonIcon.getWidth() + 5,
				pantheonTitleLabel.getY() - pantheonNameLabel.getHeight() - 15);
		addActor(pantheonNameLabel);

		this.pantheonDescLabel = new CustomLabel(player.getReligion().getPickedBonuses().get(0).getDesc());
		pantheonDescLabel.setPosition(13, pantheonIcon.getY() - pantheonDescLabel.getHeight() - 10);
		addActor(pantheonDescLabel);

		if (player.getReligion().getPickedBonuses().size() < 2)
			return;

		this.founderBeliefTitleLabel = new CustomLabel("Founder Belief: ");
		founderBeliefTitleLabel.setPosition(14, pantheonDescLabel.getY() - 55);
		addActor(founderBeliefTitleLabel);

		this.founderBeliefIcon = new ColoredBackground(
				player.getReligion().getPickedBonuses().get(1).getIcon().sprite(), 14,
				founderBeliefTitleLabel.getY() - 38, 32, 32);
		addActor(founderBeliefIcon);

		this.founderBeliefNameLabel = new CustomLabel(player.getReligion().getPickedBonuses().get(1).getName());
		founderBeliefNameLabel.setPosition(founderBeliefIcon.getX() + founderBeliefIcon.getWidth() + 5,
				founderBeliefTitleLabel.getY() - founderBeliefNameLabel.getHeight() - 15);
		addActor(founderBeliefNameLabel);

		this.founderBeliefDescLabel = new CustomLabel(player.getReligion().getPickedBonuses().get(1).getDesc());
		founderBeliefDescLabel.setPosition(13, founderBeliefIcon.getY() - founderBeliefDescLabel.getHeight() - 10);
		addActor(founderBeliefDescLabel);

		this.followerBeliefTitleLabel = new CustomLabel("Follower Belief: ");
		followerBeliefTitleLabel.setPosition(14, founderBeliefDescLabel.getY() - 55);
		addActor(followerBeliefTitleLabel);

		this.followerBeliefIcon = new ColoredBackground(
				player.getReligion().getPickedBonuses().get(2).getIcon().sprite(), 14,
				followerBeliefTitleLabel.getY() - 38, 32, 32);
		addActor(followerBeliefIcon);

		this.followerBeliefNameLabel = new CustomLabel(player.getReligion().getPickedBonuses().get(2).getName());
		followerBeliefNameLabel.setPosition(followerBeliefIcon.getX() + followerBeliefIcon.getWidth() + 5,
				followerBeliefTitleLabel.getY() - followerBeliefNameLabel.getHeight() - 15);
		addActor(followerBeliefNameLabel);

		this.followerBeliefDescLabel = new CustomLabel(player.getReligion().getPickedBonuses().get(2).getDesc());
		followerBeliefDescLabel.setPosition(13, followerBeliefIcon.getY() - followerBeliefDescLabel.getHeight() - 10);
		addActor(followerBeliefDescLabel);

		this.religionName = new CustomLabel(player.getReligion().getReligionIcon().getName());
		religionName.setPosition(getWidth() / 2 - religionName.getWidth() / 2 + 150, getHeight() - 75);
		addActor(religionName);

		this.religionIcon = new ColoredBackground(player.getReligion().getReligionIcon().getTexture().sprite(),
				religionName.getX() + religionName.getWidth() / 2 - 64 / 2, religionName.getY() - 70, 64, 64);
		addActor(religionIcon);
	}

	@EventHandler
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
