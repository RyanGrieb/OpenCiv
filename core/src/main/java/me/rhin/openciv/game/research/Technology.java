package me.rhin.openciv.game.research;

import java.util.ArrayList;
import java.util.LinkedList;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.CompleteResearchListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.listener.PickResearchListener.PickResearchEvent;
import me.rhin.openciv.shared.packet.type.ChooseTechPacket;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.type.PickResearchWindow;

public abstract class Technology implements NextTurnListener, CompleteResearchListener {

	protected ArrayList<Class<? extends Technology>> requiredTechs;

	private ResearchTree researchTree;
	private TreePosition treePosition;
	private boolean researched;
	private int id;
	private boolean researching;
	private float appliedScience;
	private int appliedTurns;

	public Technology(ResearchTree researchTree, TreePosition treePosition) {
		this.researchTree = researchTree;
		this.treePosition = treePosition;
		this.requiredTechs = new ArrayList<>();
		this.researched = false;
		this.id = researchTree.getCurrentTechIDIndex();
		this.researching = false;
		this.appliedScience = 0;
		this.appliedTurns = 0;

		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CompleteResearchListener.class, this);
	}

	public static Technology fromID(int techID) {
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().getTechnologies().get(techID);
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		if (researching) {
			appliedScience += Civilization.getInstance().getGame().getPlayer().getStatLine()
					.getStatValue(Stat.SCIENCE_GAIN);
			appliedTurns++;
		}
	}

	@Override
	public void onCompleteResearch(CompleteResearchPacket packet) {
		if (packet.getTechID() != id)
			return;

		researched = true;
		researching = false;
	}

	public abstract int getScienceCost();

	public abstract String getName();

	public abstract Sprite getIcon();

	public abstract String getDesc();

	public boolean isResearched() {
		return researched;
	}

	public ArrayList<Class<? extends Technology>> getRequiredTechs() {
		return requiredTechs;
	}

	public boolean hasResearchedRequiredTechs() {
		for (Class<? extends Technology> techClazz : requiredTechs) {
			Technology tech = Civilization.getInstance().getGame().getPlayer().getResearchTree()
					.getTechnology(techClazz);

			if (!tech.isResearched())
				return false;
		}

		return true;
	}

	public int getID() {
		return id;
	}

	public void setResearching(boolean researching) {
		this.researching = researching;
	}

	public boolean isResearching() {
		return researching;
	}

	public float getAppliedScience() {
		return appliedScience;
	}

	public int getAppliedTurns() {
		return appliedTurns;
	}

	public Class<? extends Technology> getHighestRequiredTech() {
		Class<? extends Technology> highestTech = null;

		for (Class<? extends Technology> tech : requiredTechs) {
			if (highestTech == null || researchTree.getTechnology(tech).getScienceCost() > researchTree
					.getTechnology(highestTech).getScienceCost())
				highestTech = tech;
		}
		return highestTech;
	}

	public TreePosition getTreePosition() {
		return treePosition;
	}

	/**
	 * Sends the required packet & other events to properly research a tech.
	 */
	public void research() {
		ChooseTechPacket packet = new ChooseTechPacket();
		packet.setTech(id);
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
		Civilization.getInstance().getWindowManager().closeWindow(PickResearchWindow.class);

		for (Technology tech : Civilization.getInstance().getGame().getPlayer().getResearchTree().getTechnologies())
			tech.setResearching(false);

		setResearching(true);

		Civilization.getInstance().getEventManager().fireEvent(new PickResearchEvent(this));
	}

	/**
	 * Returns ordered list of all techs required to research up to this technology.
	 * 
	 * @return
	 */
	public ArrayList<Class<? extends Technology>> getRequiedTechsQueue() {
		// Get ordered list of techs to research leading up to this one..
		ResearchTree researchTree = Civilization.getInstance().getGame().getPlayer().getResearchTree();
		ArrayList<Class<? extends Technology>> requiredTechs = new ArrayList<>();

		LinkedList<Technology> techQueue = new LinkedList<>();
		techQueue.add(this);

		while (techQueue.size() > 0) {
			Technology currentTech = techQueue.pop();

			ArrayList<Class<? extends Technology>> techRequirements = currentTech.getRequiredTechs();

			for (Class<? extends Technology> techClass : techRequirements) {
				if (!researchTree.hasResearched(techClass)) {
					techQueue.add(researchTree.getTechnology(techClass));
				}
			}

			if (!requiredTechs.contains(currentTech.getClass()))
				requiredTechs.add(0, currentTech.getClass());
		}

		sortTechList(requiredTechs);

		// for (Class<? extends Technology> techClass : requiredTechs)
		// System.out.println(techClass);

		return requiredTechs;
	}

	/**
	 * Sorts the following tech list by the position of the technologies Uses simple
	 * linked list
	 * 
	 * @param techQueue
	 */
	private void sortTechList(ArrayList<Class<? extends Technology>> techList) {

		for (int i = 1; i < techList.size(); i++) {
			Technology key = Civilization.getInstance().getGame().getPlayer().getResearchTree()
					.getTechnology(techList.get(i));
			int j = i - 1;

			while (j >= 0 && key.getTreePosition().getX() < Civilization.getInstance().getGame().getPlayer()
					.getResearchTree().getTechnology(techList.get(j)).getTreePosition().getX()) {
				techList.set(j + 1, techList.get(j));
				--j;
			}

			techList.set(j + 1, key.getClass());
		}
	}
}
