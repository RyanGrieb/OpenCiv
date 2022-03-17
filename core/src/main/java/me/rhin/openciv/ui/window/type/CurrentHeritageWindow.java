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
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.OpenHeritageButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CurrentHeritageWindow extends AbstractWindow
		implements ResizeListener, PickHeritageListener, NextTurnListener, CompleteHeritageListener {

	private BlankBackground blankBackground;
	private CustomLabel heritageNameDescLabel;
	private CustomLabel heritageTurnsLabel;
	private CustomLabel heritageNameLabel;
	private OpenHeritageButton openHeritageButton;
	private ColoredBackground heritageIcon;
	private Heritage heritage;

	public CurrentHeritageWindow() {
		super.setBounds(5, viewport.getWorldHeight() - 145, 225, 60);

		this.blankBackground = new BlankBackground(0, 0, getWidth(), getHeight());
		addActor(blankBackground);

		heritageNameDescLabel = new CustomLabel("Studying: ");
		heritageNameDescLabel.setPosition(5 + 3,
				blankBackground.getY() + blankBackground.getHeight() - heritageNameDescLabel.getHeight() - 3);
		addActor(heritageNameDescLabel);

		heritageTurnsLabel = new CustomLabel("??/?? Turns");
		heritageTurnsLabel.setPosition(heritageNameDescLabel.getX() + heritageNameDescLabel.getWidth() - 2,
				heritageNameDescLabel.getY());
		addActor(heritageTurnsLabel);

		heritageNameLabel = new CustomLabel("Nothing");
		heritageNameLabel.setPosition(blankBackground.getX() + 36,
				blankBackground.getY() + heritageNameLabel.getHeight() - 3);
		addActor(heritageNameLabel);

		openHeritageButton = new OpenHeritageButton(blankBackground.getX() + blankBackground.getWidth() - 52,
				blankBackground.getY(), 48, 32);
		addActor(openHeritageButton);

		this.heritageIcon = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 2, 2, 32, 32);
		addActor(heritageIcon);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(PickHeritageListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CompleteHeritageListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		super.setPosition(5, height - 145);
	}

	@Override
	public void onPickHeritage(Heritage heritage) {
		this.heritage = heritage;

		heritageIcon.setSprite(heritage.getIcon());
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

		heritageIcon.setSprite(TextureEnum.UI_BLACK.sprite());
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
