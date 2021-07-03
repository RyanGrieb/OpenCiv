package me.rhin.openciv.server.game.production;

public class ProducingItem {

	private ProductionItem productionItem;
	private float appliedProduction;

	public ProducingItem(ProductionItem productionItem) {
		this.productionItem = productionItem;
	}

	public void applyProduction(float value) {
		appliedProduction += value;
		
		//TODO: Send ApplyProductionPacket
	}

	public ProductionItem getProductionItem() {
		return productionItem;
	}

	public float getAppliedProduction() {
		return appliedProduction;
	}

}
