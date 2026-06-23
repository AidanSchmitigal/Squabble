<script lang="ts">
	import { Counter } from '$lib/counter.svelte';
	import { roomState } from '$lib/room.svelte';
	import { Canvas, T } from '@threlte/core';
	import { GLTF, OrbitControls } from '@threlte/extras';
	import type { ThrelteGltf } from '@threlte/extras';
	import { Spring } from 'svelte/motion';
	import * as THREE from 'three';

	let { ortho }: { ortho?: boolean } = $props();

	const cardinalColors = [
		new THREE.Color(0xff4444), // +X: Red
		new THREE.Color(0x44ffff), // -X: Cyan
		new THREE.Color(0x44ff44), // +Y: Green
		new THREE.Color(0xff44ff), // -Y: Magenta
		new THREE.Color(0x4444ff), // +Z: Blue
		new THREE.Color(0xffff44) // -Z: Yellow
	];

	function setupCardinalMaterial(mat: THREE.MeshStandardMaterial): void {
		const originalOnBeforeCompile = mat.onBeforeCompile;
		mat.onBeforeCompile = (shader, renderer) => {
			originalOnBeforeCompile?.(shader, renderer);

			shader.vertexShader = shader.vertexShader.replace(
				'#include <common>',
				`#include <common>
				varying vec3 vWorldPos;`
			);

			shader.vertexShader = shader.vertexShader.replace(
				'#include <worldpos_vertex>',
				`#include <worldpos_vertex>
				vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
			);

			shader.fragmentShader = shader.fragmentShader.replace(
				'#include <common>',
				`#include <common>
				uniform vec3 uCardinalColors[6];
				varying vec3 vWorldPos;`
			);

			shader.fragmentShader = shader.fragmentShader.replace(
				'#include <color_fragment>',
				`#include <color_fragment>
				vec3 _absPos = abs(vWorldPos);
				vec3 _cardinalColor;
				if (_absPos.x >= _absPos.y && _absPos.x >= _absPos.z) {
					_cardinalColor = uCardinalColors[vWorldPos.x >= 0.0 ? 0 : 1];
				} else if (_absPos.y >= _absPos.x && _absPos.y >= _absPos.z) {
					_cardinalColor = uCardinalColors[vWorldPos.y >= 0.0 ? 2 : 3];
				} else {
					_cardinalColor = uCardinalColors[vWorldPos.z >= 0.0 ? 4 : 5];
				}
				diffuseColor.rgb *= _cardinalColor;`
			);

			shader.uniforms.uCardinalColors = { value: cardinalColors };
		};
		mat.needsUpdate = true;
	}

	function applyCardinalColors(root: THREE.Object3D): void {
		root.traverse((child) => {
			if (!(child instanceof THREE.Mesh)) return;

			const materials = Array.isArray(child.material) ? child.material : [child.material];

			for (const mat of materials) {
				if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
				setupCardinalMaterial(mat);
			}
		});
	}

	const arrowConfig: Record<
		string,
		{ pos: [number, number, number]; rot: [number, number, number]; color: string }
	> = {
		Red: { pos: [3, 0, 0], rot: [0, 0, Math.PI / 2], color: '#ff4444' },
		Cyan: { pos: [-3, 0, 0], rot: [0, 0, -Math.PI / 2], color: '#44ffff' },
		Green: { pos: [0, 2.8, 0], rot: [Math.PI, 0, 0], color: '#44ff44' },
		Magenta: { pos: [0, -2.8, 0], rot: [0, 0, 0], color: '#ff44ff' },
		Blue: { pos: [0, 0, 3], rot: [-Math.PI / 2, 0, 0], color: '#4444ff' },
		Yellow: { pos: [0, 0, -3], rot: [Math.PI / 2, 0, 0], color: '#ffff44' }
	};

	let hideModel = $derived(roomState.gameState.phase === 'draw');
	let targetAngle = $derived(roomState.gameState.challenge.targetAngle);
	let arrow = $derived(arrowConfig[targetAngle]);
	let model = $derived(roomState.gameState.challenge.model);
	let showGrid = $derived(roomState.gameState.settings.showGrid);
	let challengeRotation = $derived(roomState.gameState.challenge.rotation);
	let randomRotations = $derived(roomState.gameState.settings.randomRotations);
	let modelRotation: [number, number, number] = $derived(
		randomRotations ? challengeRotation : [0, 0, 0]
	);

	let angle = new Spring(0.6, { stiffness: 0.001, damping: 0, precision: 0.001 });
	let spin: Counter | Spring<number> = new Counter(0, { autoStart: true, rate: 1 });

	$effect(() => {
		if (ortho) {
			if (targetAngle === 'Green') {
				angle.set(Math.PI / 2, { instant: true });
				angle.target = Math.PI / 2;
			} else if (targetAngle === 'Magenta') {
				angle.set(-Math.PI / 2, { instant: true });
				angle.target = -Math.PI / 2;
			} else {
				angle.set(0, { instant: true });
				angle.target = 0;
			}

			let angleRot = 0;
			switch (targetAngle) {
				case 'Red':
					angleRot = 0;
					break;
				case 'Cyan':
					angleRot = Math.PI;
					break;
				case 'Blue':
					angleRot = Math.PI / 2;
					break;
				case 'Yellow':
					angleRot = -Math.PI / 2;
					break;
			}
			spin = new Counter(angleRot, { autoStart: false, rate: 0 });
		} else if (hideModel) {
			if (targetAngle === 'Green') {
				angle.set(0.7, { instant: true });
				angle.target = 0.5;
			} else if (targetAngle === 'Magenta') {
				angle.set(-0.7, { instant: true });
				angle.target = -0.5;
			} else {
				angle.set(0.6, { instant: true });
				angle.target = 0;

				let angleRot = 0;
				switch (targetAngle) {
					case 'Red':
						angleRot = 0;
						break;
					case 'Cyan':
						angleRot = Math.PI;
						break;
					case 'Blue':
						angleRot = Math.PI / 2;
						break;
					case 'Yellow':
						angleRot = -Math.PI / 2;
						break;
				}
				spin = new Spring(angleRot + 1, { stiffness: 0.0005, damping: 0 });
				spin.target = angleRot;
			}
		} else {
			angle.set(0.6);
			angle.target = 0;
			spin = new Counter(0, { autoStart: true, rate: 1 });
		}
	});

	let h = $derived(Math.sin(angle.current) * 5);
	let w = $derived(Math.cos(angle.current) * 5);

	/*
  Ry = [ cos t   0   sin t   [ w       [  w cos t
           0     1     0       h    =     h
        -sin t   0   cos t ]   0 ]        -w sin t ]
  */

	let x = $derived(Math.cos(spin.current) * w);
	let z = $derived(Math.sin(spin.current) * w);

	function handleGltfLoad(gltf: ThrelteGltf): void {
		applyCardinalColors(gltf.scene);
	}
</script>

<div class="size-full">
	<Canvas toneMapping={THREE.ACESFilmicToneMapping} shadows dpr={[1, 2]}>
		{#if ortho}
			<T.OrthographicCamera
				makeDefault
				zoom={62}
				near={0.1}
				far={100}
				position={[x, h, z]}
				oncreate={(c) => c.lookAt(0, 0, 0)}
			/>
		{:else}
			<T.PerspectiveCamera
				makeDefault
				fov={35}
				near={0.1}
				far={100}
				position={[x, h, z]}
				oncreate={(c) => c.lookAt(0, 0, 0)}
			/>
		{/if}
		<OrbitControls
			autoRotate
			autoRotateSpeed={0}
			enableDamping={false}
			enablePan={false}
			enableZoom={false}
			enableRotate={false}
			enabled={false}
		/>

		<T.AmbientLight color="#404060" intensity={0.5} />
		<!-- <T.HemisphereLight color="#ffeedd" groundColor="#080820" intensity={800} /> -->

		<T.DirectionalLight
			color="#ffeedd"
			intensity={2.5}
			position={[4, 6, 4]}
			castShadow
			shadow-mapSize-width={1024}
			shadow-mapSize-height={1024}
		/>

		<T.DirectionalLight color="#4488ff" intensity={0.6} position={[-3, 1, 3]} />
		<T.DirectionalLight color="#ffffff" intensity={0.8} position={[-1, 3, -5]} />

		<T.PointLight color="#ff8844" intensity={0.6} distance={10} position={[-2, 3, 2]} />

		<T.DirectionalLight color="#4488ff" intensity={0.6} position={[-3, -1, 3]} />
		<T.DirectionalLight color="#ffffff" intensity={0.8} position={[-1, -3, -5]} />
		<T.DirectionalLight color="#4488ff" intensity={0.6} position={[3, -1, -3]} />
		<T.DirectionalLight color="#ffffff" intensity={0.8} position={[1, -3, 5]} />

		{#if showGrid}
			<T.GridHelper args={[10, 10]} />
		{/if}

		{#if !hideModel}
			<GLTF url={model} position={[0, 0, 0]} rotation={modelRotation} onload={handleGltfLoad} />
		{:else}
			<T.Mesh scale={[1.5, 1.5, 1.5]}>
				<T.BoxGeometry />
				<T.MeshStandardMaterial oncreate={(mat) => setupCardinalMaterial(mat)} />
			</T.Mesh>
			<T.Group position={arrow.pos}>
				<T.Group rotation={arrow.rot}>
					<T.Mesh position={[0, 0.8, 0]}>
						<T.CylinderGeometry args={[0.06, 0.06, 1.6]} />
						<T.MeshStandardMaterial color={arrow.color} />
					</T.Mesh>
					<T.Mesh position={[0, 1.7, 0]}>
						<T.ConeGeometry args={[0.22, 0.3]} />
						<T.MeshStandardMaterial color={arrow.color} />
					</T.Mesh>
				</T.Group>
			</T.Group>
		{/if}
	</Canvas>
</div>
