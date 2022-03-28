package me.rhin.openciv.events;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.packet.Packet;

public class NetworkEvent implements Event {

	private String methodName;
	private Packet packet;

	public NetworkEvent(String methodName, Class<? extends Packet> packetClass, String packetData) {
		this.methodName = methodName;
		Json json = new Json();
		this.packet = json.fromJson(packetClass, packetData);
	}

	@Override
	public String getMethodName() {
		return methodName;
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { packet };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { packet.getClass() };
	}

}
