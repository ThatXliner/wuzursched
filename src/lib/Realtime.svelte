<script lang="ts">
	export let realtimeStatus: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' = 'CLOSED';
</script>

<span
	class="sticky center-horizontal bottom-5 drop-shadow-lg tooltip"
	data-tip="You are {realtimeStatus === 'SUBSCRIBED'
		? 'connected'
		: 'disconnected'} to the realtime server"
>
	{#if realtimeStatus === 'SUBSCRIBED'}<span class="badge badge-success p-3">connected</span
		>{:else}<span class="badge badge-error p-3">disconnected</span>{/if}
</span>

<style>
	.center-horizontal {
		/*shift 50% of the page*/
		left: 50%;
		/* Move 50% of itself backwards */
		transform: translate(-50%, 0);
	}
</style>
