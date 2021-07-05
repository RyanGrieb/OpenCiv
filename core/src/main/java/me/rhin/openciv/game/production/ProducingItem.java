package me.rhin.openciv.game.production;

public class ProducingItem {

	private ProductionItem productionItem;
	private float appliedProduction;
	private int appliedTurns;

	public ProducingItem(ProductionItem productionItem) {
		this.productionItem = productionItem;
		this.appliedProduction = 0;
		this.appliedTurns = 0;
	}

	public void applyProduction(float value) {
		appliedProduction += value;
		//FIXME: Sometimes this doesn't apply when we chop trees
		appliedTurns++;
	}

	public ProductionItem getProductionItem() {
		return productionItem;
	}

	public float getAppliedProduction() {
		return appliedProduction;
	}

	public int getAppiedTurns() {
		return appliedTurns;
	}
}
