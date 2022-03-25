package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.math.MathUtils;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.game.notification.type.NotStudyingNotification;
import me.rhin.openciv.listener.CompleteHeritageListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.listener.PickHeritageListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.packet.type.CompleteHeritagePacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CurrentHeritageWindow extends AbstractWindow
		implements ResizeListener, PickHeritageListener, NextTurnListener, CompleteHeritageListener {

	private ColoredBackground blankBackground;
	private CustomLabel heritageNameDescLabel;
	private CustomLabel heritageTurnsLabel;
	private CustomLabel heritageNameLabel;
	private CustomButton openHeritageButton;
	private ColoredBackground heritageIcon;
	private Heritage heritage;

	public CurrentHeritageWindow() {
		super.setBounds(5, viewport.getWorldHeight() - 155, 225, 60);

		this.blankBackground = new ColoredBackground(TextureEnum.UI_POPUP_BOX_D.sprite(), 0, 0, getWidth(),
				getHeight());
		addActor(blankBackground);

		heritageNameDescLabel = new CustomLabel("Studying: ");
		heritageNameDescLabel.setPosition(5 + 3,
				blankBackground.getY() + blankBackground.getHeight() - heritageNameDescLabel.getHeight() - 6);
		addActor(heritageNameDescLabel);

		heritageTurnsLabel = new CustomLabel("??/?? Turns");
		heritageTurnsLabel.setPosition(heritageNameDescLabel.getX() + heritageNameDescLabel.getWidth() - 2,
				heritageNameDescLabel.getY());
		addActor(heritageTurnsLabel);

		heritageNameLabel = new CustomLabel("Nothing");
		heritageNameLabel.setPosition(blankBackground.getX() + 40,
				blankBackground.getY() + heritageNameLabel.getHeight() - 2);
		addActor(heritageNameLabel);

		openHeritageButton = new CustomButton(TextureEnum.UI_BUTTON_SMALL, TextureEnum.UI_BUTTON_SMALL_HOVERED,
				TextureEnum.ICON_HERITAGE, blankBackground.getX() + blankBackground.getWidth() - 52,
				blankBackground.getY() + 3, 48, 32, 16, 16);
		openHeritageButton.onClick(() -> {
			if (Civilization.getInstance().getGame().getPlayer().getOwnedCities().size() < 1)
				return;

			Civilization.getInstance().getWindowManager().toggleWindow(new HeritageWindow());
		});
		addActor(openHeritageButton);

		this.heritageIcon = new ColoredBackground(TextureEnum.UI_CLEAR.sprite(), 6, 6, 32, 32);
		addActor(heritageIcon);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(PickHeritageListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CompleteHeritageListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		super.setPosition(5, height - 155);
	}

	@Override
	public void onPickHeritage(Heritage heritage) {
		this.heritage = heritage;

		heritageIcon.setSprite(heritage.getIcon());
		heritageIcon.setBounds(6, 6, 32, 32);
		heritageNameLabel.setText(heritage.getName());

		if (heritageNameLabel.getWidth() > 120)
			heritageNameLabel.setText(heritage.getName().substring(0, 13) + "..");

		int totalTurns = (int) Math.ceil(heritage.getCost()
				/ Civilization.getInstance().getGame().getPlayer().getStatLine().getStatValue(Stat.HERITAGE_GAIN));

		int currentTurns = (int) heritage.getAppliedTurns();

		heritageTurnsLabel.setText(currentTurns + "/" + totalTurns + " Turns");
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {

		// FIXME: Null when we choose a tech?
		if (heritage == null)
			return;

		float appliedHeritage = heritage.getAppliedHeritage()
				+ Civilization.getInstance().getGame().getPlayer().getStatLine().getStatValue(Stat.HERITAGE_GAIN);

		int turnsLeft = MathUtils.ceil((heritage.getCost() - appliedHeritage)
				/ Civilization.getInstance().getGame().getPlayer().getStatLine().getStatValue(Stat.HERITAGE_GAIN)) + 1;

		int currentTurns = (int) heritage.getAppliedTurns(); // +1 since this listener before

		int totalTurns = currentTurns + turnsLeft;

		heritageTurnsLabel.setText(currentTurns + "/" + totalTurns + " Turns");
	}

	@Override
	public void onCompleteHeritage(CompleteHeritagePacket packet) {

		// FIXME: We really should check if this is correct.
		// if (!heritage.getName().equals(packet.getHeritageName()))
		// return;
		if (!Civilization.getInstance().getGame().getPlayer().getHeritageTree()
				.getHeritageFromClassName(packet.getHeritageName()).equals(heritage))
			return;

		heritageIcon.setSprite(TextureEnum.UI_CLEAR.sprite());
		heritageIcon.setBounds(6, 6, 32, 32);
		heritageNameLabel.setText("Nothing");
		heritageTurnsLabel.setText("??/?? Turns");

		heritage = null;

		// FIXME: Move somewhere else?
		boolean treeComplete = true;

		for (Heritage heritage : Civilization.getInstance().getGame().getPlayer().getHeritageTree().getAllHeritage()) {
			if (!heritage.isStudied() && heritage.ableToStudy())
				treeComplete = false;
		}

		if (!treeComplete)
			Civilization.getInstance().getGame().getNotificationHanlder()
					.fireNotification(new NotStudyingNotification());
	}

	@Override
	public boolean disablesInput() {
		return false;
	}

	@Override
	public boolean disablesCameraMovement() {
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return true;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}
}
