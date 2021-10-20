package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.CombatPreviewListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.listener.SetCityHealthListener;
import me.rhin.openciv.listener.UnitAttackListener;
import me.rhin.openciv.shared.packet.type.CombatPreviewPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.SetCityHealthPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.game.Healthbar;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class UnitCombatWindow extends AbstractWindow
		implements ResizeListener, CombatPreviewListener, NextTurnListener, SetCityHealthListener, UnitAttackListener {

	// Show preview of health amounts of the unit, and the unit being attacked.
	private AttackableEntity attackingEntity;
	private AttackableEntity targetEntity;

	private BlankBackground blankBackground;
	private ColoredBackground attackerIcon;
	private ColoredBackground targetIcon;
	private CustomLabel combatPreviewLabel;
	private CustomLabel attackerLabel;
	private CustomLabel targetLabel;
	private CustomLabel versusLabel;
	private Healthbar attackerHealthbar;
	private Healthbar targetHealthbar;

	public UnitCombatWindow(AttackableEntity attackingEntity, AttackableEntity targetEntity) {
		super.setBounds(viewport.getWorldWidth() - 200, 105, 200, 75);

		this.attackingEntity = attackingEntity;
		this.targetEntity = targetEntity;

		this.blankBackground = new BlankBackground(0, 0, 200, 75);
		addActor(blankBackground);

		this.combatPreviewLabel = new CustomLabel("Combat Preview", 0, getHeight() - 15, 200, 15);
		combatPreviewLabel.setAlignment(Align.center);
		addActor(combatPreviewLabel);

		// FIXME: The naming scheme of coloredbackground is weird.
		this.attackerIcon = new ColoredBackground(attackingEntity.getPlayerOwner().getCivilization().getIcon().sprite(),
				2, getHeight() - 35, 16, 16);
		addActor(attackerIcon);

		this.attackerLabel = new CustomLabel(attackingEntity.getName());
		attackerLabel.setPosition(20, getHeight() - 35);
		addActor(attackerLabel);

		this.attackerHealthbar = new Healthbar(getWidth() - 77, attackerLabel.getY(), 75, 15, true);
		attackerHealthbar.setHealth(attackingEntity.getMaxHealth(), attackingEntity.getHealth());
		addActor(attackerHealthbar);

		this.versusLabel = new CustomLabel("Vs.");
		versusLabel.setPosition(35, getHeight() - 50);
		addActor(versusLabel);

		this.targetIcon = new ColoredBackground(targetEntity.getPlayerOwner().getCivilization().getIcon().sprite(), 2,
				getHeight() - 65, 16, 16);
		addActor(targetIcon);

		this.targetLabel = new CustomLabel(targetEntity.getName());
		targetLabel.setPosition(20, getHeight() - 65);
		addActor(targetLabel);

		this.targetHealthbar = new Healthbar(getWidth() - 77, targetLabel.getY(), 75, 15, true);
		targetHealthbar.setHealth(attackingEntity.getMaxHealth(), targetEntity.getHealth());
		addActor(targetHealthbar);

		// Attempt to get combat preview values from the server.
		sendCombatPreviewPacket();

		Civilization.getInstance().getEventManager().addListener(CombatPreviewListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetCityHealthListener.class, this);
		Civilization.getInstance().getEventManager().addListener(UnitAttackListener.class, this);
	}

	@Override
	public void onCombatPreview(CombatPreviewPacket packet) {
		float unitDamage = packet.getUnitDamage();
		float targetUnitDamage = packet.getTargetUnitDamage();

		attackerHealthbar.setHealth(attackingEntity.getMaxHealth(), attackingEntity.getHealth() - unitDamage);
		targetHealthbar.setHealth(targetEntity.getMaxHealth(), targetEntity.getHealth() - targetUnitDamage);
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		if (targetEntity == null || attackingEntity == null)
			return;

		sendCombatPreviewPacket();
	}

	@Override
	public void onSetCityHealth(SetCityHealthPacket packet) {
		if (targetEntity == null || attackingEntity == null)
			return;

		sendCombatPreviewPacket();
	}

	@Override
	public void onUnitAttack(UnitAttackPacket packet) {
		GameMap map = Civilization.getInstance().getGame().getMap();

		// TODO: Test with another user to see if this code functions properly.

		Unit unit = map.getTiles()[packet.getUnitGridX()][packet.getUnitGridY()].getTopUnit();
		// FIXME: Not having a unit ID here is problematic.
		AttackableEntity targetEntity = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()]
				.getEnemyAttackableEntity(unit.getPlayerOwner());

		if (targetEntity.equals(this.targetEntity) || unit.equals(this.targetEntity)
				|| targetEntity.equals(this.attackingEntity) || unit.equals(this.attackingEntity)) {
			sendCombatPreviewPacket();
		}

	}

	@Override
	public void onClose() {
		Civilization.getInstance().getEventManager().clearListenersFromObject(this);
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

	private void sendCombatPreviewPacket() {
		// Attempt to get combat preview values from the server.
		CombatPreviewPacket combatPacket = new CombatPreviewPacket();
		combatPacket.setEntityLocations(attackingEntity.getID(), attackingEntity.getTile().getGridX(),
				attackingEntity.getTile().getGridY(), targetEntity.getID(), targetEntity.getTile().getGridX(),
				targetEntity.getTile().getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(combatPacket);
	}
}
