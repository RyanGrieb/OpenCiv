package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.button.type.DeclareWarButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class DeclareWarWindow extends AbstractWindow implements ResizeListener {

	private ColoredBackground background;
	private CloseWindowButton closeWindowButton;
	private DeclareWarButton declareWarButton;
	private CustomLabel declareWarDescLabel;
	private ColoredBackground attackerIcon;
	private ColoredBackground swordsIcon;
	private ColoredBackground defenderIcon;

	public DeclareWarWindow(AbstractPlayer attacker, AbstractPlayer defender) {
		super.setBounds(viewport.getWorldWidth() / 2 - 250 / 2, viewport.getWorldHeight() / 2 - 250 / 2, 250, 250);

		this.background = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, getWidth(), getHeight());
		addActor(background);

		this.declareWarDescLabel = new CustomLabel("Declare War", Align.center, 0, getHeight() - 14, getWidth(), 14);
		addActor(declareWarDescLabel);

		this.attackerIcon = new ColoredBackground(attacker.getCivilization().getIcon().sprite(), 60, getHeight() - 100,
				32, 32);
		addActor(attackerIcon);

		this.swordsIcon = new ColoredBackground(TextureEnum.ICON_COMBAT.sprite(), getWidth() / 2 - 32 / 2,
				getHeight() - 100, 32, 32);
		addActor(swordsIcon);

		this.defenderIcon = new ColoredBackground(defender.getCivilization().getIcon().sprite(), getWidth() - 60 - 32,
				getHeight() - 100, 32, 32);
		addActor(defenderIcon);

		this.declareWarButton = new DeclareWarButton(attacker, defender, getWidth() / 2 - 127 / 2, 50, 127, 35);
		addActor(declareWarButton);

		this.closeWindowButton = new CloseWindowButton(getClass(), "Cancel", getWidth() / 2 - 127 / 2, 5, 127, 35);
		addActor(closeWindowButton);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);

	}

	@Override
	public void onResize(int width, int height) {
		super.setBounds(width / 2 - 250 / 2, height / 2 - 250 / 2, 250, 250);
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
		return false;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}

}
