package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.CombatPreviewListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.packet.type.CombatPreviewPacket;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.game.Healthbar;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class UnitCombatWindow extends AbstractWindow implements ResizeListener, CombatPreviewListener {

	// Show preview of health amounts of the unit, and the unit being attacked.
	private BlankBackground blankBackground;
	private ColoredBackground unitIcon;
	private ColoredBackground targetUnitIcon;
	private CustomLabel combatPreviewLabel;
	private CustomLabel unitLabel;
	private CustomLabel targetUnitLabel;
	private CustomLabel versusLabel;
	private Healthbar unitHealthbar;
	private Healthbar targetUnitHealthbar;

	public UnitCombatWindow(Unit unit, Unit targetUnit) {
		super.setBounds(viewport.getWorldWidth() - 200, 105, 200, 75);

		this.blankBackground = new BlankBackground(0, 0, 200, 75);
		addActor(blankBackground);

		this.combatPreviewLabel = new CustomLabel("Combat Preview", 0, getHeight() - 15, 200, 15);
		combatPreviewLabel.setAlignment(Align.center);
		addActor(combatPreviewLabel);

		// FIXME: The naming scheme of coloredbackground is weird.
		this.unitIcon = new ColoredBackground(unit.getPlayerOwner().getCivType().getIcon().sprite(), 2,
				getHeight() - 35, 16, 16);
		addActor(unitIcon);

		this.unitLabel = new CustomLabel(unit.getName());
		unitLabel.setPosition(20, getHeight() - 35);
		addActor(unitLabel);

		this.unitHealthbar = new Healthbar(getWidth() - 77, unitLabel.getY(), 75, 15);
		unitHealthbar.setHealth(unit.getHealth());
		addActor(unitHealthbar);

		this.versusLabel = new CustomLabel("Vs.");
		versusLabel.setPosition(35, getHeight() - 50);
		addActor(versusLabel);

		this.targetUnitIcon = new ColoredBackground(targetUnit.getPlayerOwner().getCivType().getIcon().sprite(), 2,
				getHeight() - 65, 16, 16);
		addActor(targetUnitIcon);

		this.targetUnitLabel = new CustomLabel(targetUnit.getName());
		targetUnitLabel.setPosition(20, getHeight() - 65);
		addActor(targetUnitLabel);

		this.targetUnitHealthbar = new Healthbar(getWidth() - 77, targetUnitLabel.getY(), 75, 15);
		targetUnitHealthbar.setHealth(targetUnit.getHealth());
		addActor(targetUnitHealthbar);

		// Attempt to get combat preview values from the server.
		CombatPreviewPacket packet = new CombatPreviewPacket();
		packet.setUnitLocations(unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY(),
				targetUnit.getStandingTile().getGridX(), targetUnit.getStandingTile().getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);

		Civilization.getInstance().getEventManager().addListener(CombatPreviewListener.class, this);
	}

	@Override
	public void onCombatPreview(CombatPreviewPacket packet) {
		float unitDamage = packet.getUnitDamage();
		float targetUnitDamage = packet.getTargetUnitDamage();

		unitHealthbar.setHealth(MathUtils.clamp(unitHealthbar.getHealth() - unitDamage, 0, 100));
		targetUnitHealthbar.setHealth(MathUtils.clamp(targetUnitHealthbar.getHealth() - targetUnitDamage, 0, 100));
	}

	@Override
	public void onResize(int width, int height) {

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
	public boolean closesGameDisplayWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}

}
