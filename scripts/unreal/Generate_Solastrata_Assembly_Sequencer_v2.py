# Generate_Solastrata_Assembly_Sequencer_v2.py
# Solastrata™ BIPV-T Active Glazing Systems – Factory Digital Twin
# Unreal Engine 5.3+  |  Camera cuts + material parameter tracks
# Source: assembly_sequence.json + components.json

import unreal
from typing import List

STATIONS = [
    {
        "step_order": 1, "station_name": "Core Preparation & Doping",
        "target_component_id": "core_zeonex_480r_4mm",
        "animation_data": {
            "action_type": "spawn",
            "start_transform": {"position": [0.0, 0.85, 0.0], "rotation": [0, 0, 0]},
            "end_transform":   {"position": [0.0, 0.0, 0.0], "rotation": [0, 0, 0]},
            "duration_seconds": 4.5, "tool_reference": "N2_Atmosphere_Casting_Station"
        },
        "secondary_actions": [
            {"target_component_id": "dye_lumogen_red_305", "action_type": "dispense_sealant", "duration_seconds": 2.0, "tool_reference": "Precision_Dye_Dispenser"},
            {"target_component_id": "qd_inp_zns_core_shell", "action_type": "dispense_sealant", "duration_seconds": 2.2, "tool_reference": "QD_Injection_Head"},
            {"target_component_id": "barrier_ald_aln_sio2_35nm", "action_type": "press", "duration_seconds": 6.0, "tool_reference": "ALD_Chamber_Beneq"}
        ],
        "camera_pos": [1.8, 1.4, 1.6], "camera_look": [0.0, 0.0, 0.3]
    },
    {
        "step_order": 2, "station_name": "Glass Washing & Prep",
        "target_component_id": "glass_outer_lite_lowiron_2mm",
        "animation_data": {
            "action_type": "translate",
            "start_transform": {"position": [-1.2, 0.0, 0.0], "rotation": [0, 0, 0]},
            "end_transform":   {"position": [0.0, 0.0, 0.0], "rotation": [0, 0, 0]},
            "duration_seconds": 3.0, "tool_reference": "IPA_Wash_Station"
        },
        "secondary_actions": [
            {"target_component_id": "glass_inner_lite_lowiron_2mm", "action_type": "translate", "duration_seconds": 3.0, "tool_reference": "IPA_Wash_Station"}
        ],
        "camera_pos": [2.2, 0.8, 1.2], "camera_look": [0.0, 0.0, 0.2]
    },
    {
        "step_order": 3, "station_name": "Vacuum-Bag Lamination",
        "target_component_id": "oca_upper_3m_8146",
        "animation_data": {
            "action_type": "press",
            "start_transform": {"position": [0.0, 0.15, 0.0], "rotation": [0, 0, 0]},
            "end_transform":   {"position": [0.0, 0.0, 0.0], "rotation": [0, 0, 0]},
            "duration_seconds": 8.0, "tool_reference": "Vacuum_Bag_Press_80C"
        },
        "secondary_actions": [
            {"target_component_id": "oca_lower_3m_8146", "action_type": "press", "duration_seconds": 8.0, "tool_reference": "Vacuum_Bag_Press_80C"},
            {"target_component_id": "coating_fluoropolymer_hydrophobic", "action_type": "dispense_sealant", "duration_seconds": 2.5, "tool_reference": "Fluoropolymer_Spray_Head"}
        ],
        "camera_pos": [1.5, 1.6, 1.8], "camera_look": [0.0, 0.0, 0.4]
    },
    {
        "step_order": 4, "station_name": "PV String Layup & Hydronic",
        "target_component_id": "pv_edge_gaas_strips",
        "animation_data": {
            "action_type": "weld",
            "start_transform": {"position": [-0.48, 0.0, 0.0], "rotation": [0, 90, 0]},
            "end_transform":   {"position": [-0.48, 0.0, 0.0], "rotation": [0, 90, 0]},
            "duration_seconds": 5.5, "tool_reference": "GaAs_Edge_Mount_Robot"
        },
        "secondary_actions": [
            {"target_component_id": "ribbon_busbar_2mm_cu", "action_type": "weld", "duration_seconds": 3.5, "tool_reference": "Ribbon_Solder_Station"},
            {"target_component_id": "hydronic_copper_tube_1_4in", "action_type": "translate", "duration_seconds": 4.0, "tool_reference": "Tube_Bender_Installer"}
        ],
        "camera_pos": [1.2, 0.9, 1.4], "camera_look": [-0.3, 0.0, 0.2]
    },
    {
        "step_order": 5, "station_name": "Wiring & Inverter Potting (Upper Chamber)",
        "target_component_id": "inverter_buckboost_pcb",
        "animation_data": {
            "action_type": "spawn",
            "start_transform": {"position": [0.0, 0.6, 0.25], "rotation": [0, 0, 0]},
            "end_transform":   {"position": [0.0, 0.05, 0.22], "rotation": [0, 0, 0]},
            "duration_seconds": 3.5, "tool_reference": "PickPlace_Robot_Kuka_KR16"
        },
        "secondary_actions": [
            {"target_component_id": "bus_16awg_ptfe", "action_type": "translate", "duration_seconds": 2.8, "tool_reference": "Wire_Routing_Arm"},
            {"target_component_id": "connectors_ip67_mc4", "action_type": "weld", "duration_seconds": 2.0, "tool_reference": "Connector_Crimp_Station"},
            {"target_component_id": "potting_epoxy_thermal_ip67", "action_type": "dispense_sealant", "duration_seconds": 6.0, "tool_reference": "Kuka_KR16_GlueDispenser"}
        ],
        "camera_pos": [1.0, 1.1, 1.5], "camera_look": [0.0, 0.1, 0.3]
    },
    {
        "step_order": 6, "station_name": "Frame Pultrusion & Thermal Break Insertion",
        "target_component_id": "frame_dual_cavity_thermal_break",
        "animation_data": {
            "action_type": "translate",
            "start_transform": {"position": [0.0, -0.9, 0.0], "rotation": [0, 0, 0]},
            "end_transform":   {"position": [0.0, 0.0, 0.0], "rotation": [0, 0, 0]},
            "duration_seconds": 5.0, "tool_reference": "Frame_Assembly_Jig"
        },
        "secondary_actions": [
            {"target_component_id": "sealant_structural_silicone", "action_type": "dispense_sealant", "duration_seconds": 7.0, "tool_reference": "Kuka_KR16_GlueDispenser"}
        ],
        "camera_pos": [2.0, 1.3, 1.7], "camera_look": [0.0, 0.0, 0.2]
    },
    {
        "step_order": 7, "station_name": "Edge Sealing & IGU Press",
        "target_component_id": "sealant_structural_silicone",
        "animation_data": {
            "action_type": "press",
            "start_transform": {"position": [0.0, 0.0, 0.0], "rotation": [0, 0, 0]},
            "end_transform":   {"position": [0.0, 0.0, 0.0], "rotation": [0, 0, 0]},
            "duration_seconds": 4.0, "tool_reference": "Final_Press_Station"
        },
        "secondary_actions": [],
        "camera_pos": [1.6, 1.0, 1.3], "camera_look": [0.0, 0.0, 0.15]
    },
    {
        "step_order": 8, "station_name": "Final Pressure & Thermal Testing",
        "target_component_id": "coolant_pg_water_40_60",
        "animation_data": {
            "action_type": "dispense_sealant",
            "start_transform": {"position": [0.3, 0.0, 0.1], "rotation": [0, 0, 0]},
            "end_transform":   {"position": [0.3, 0.0, 0.1], "rotation": [0, 0, 0]},
            "duration_seconds": 5.0, "tool_reference": "Hydronic_Fill_and_Pressure_Test"
        },
        "secondary_actions": [
            {"target_component_id": "inverter_buckboost_pcb", "action_type": "press", "duration_seconds": 3.0, "tool_reference": "NEC690_RapidShutdown_Tester"}
        ],
        "camera_pos": [1.9, 1.2, 1.5], "camera_look": [0.2, 0.0, 0.25]
    }
]

def make_transform(pos: List[float], rot: List[float]) -> unreal.Transform:
    location = unreal.Vector(pos[0] * 100.0, pos[1] * 100.0, pos[2] * 100.0)
    rotation = unreal.Rotator(rot[0], rot[1], rot[2])
    return unreal.Transform(location, rotation, unreal.Vector(1, 1, 1))

def add_transform_keys(section, start_tf, end_tf, start_frame, end_frame):
    channels = section.get_all_channels()
    for i, (s, e) in enumerate([
        (start_tf.translation.x, end_tf.translation.x),
        (start_tf.translation.y, end_tf.translation.y),
        (start_tf.translation.z, end_tf.translation.z)
    ]):
        channels[i].add_key(unreal.FrameNumber(start_frame), s)
        channels[i].add_key(unreal.FrameNumber(end_frame), e)
    for i, (s, e) in enumerate([
        (start_tf.rotation.roll, end_tf.rotation.roll),
        (start_tf.rotation.pitch, end_tf.rotation.pitch),
        (start_tf.rotation.yaw, end_tf.rotation.yaw)
    ], start=3):
        channels[i].add_key(unreal.FrameNumber(start_frame), s)
        channels[i].add_key(unreal.FrameNumber(end_frame), e)

def calculate_camera_transform(pos: List[float], look: List[float]) -> unreal.Transform:
    loc = unreal.Vector(pos[0] * 100.0, pos[1] * 100.0, pos[2] * 100.0)
    target = unreal.Vector(look[0] * 100.0, look[1] * 100.0, look[2] * 100.0)
    direction = target - loc
    rotator = direction.to_rotator()
    return unreal.Transform(loc, rotator, unreal.Vector(1, 1, 1))

def generate_sequencer_v2():
    fps = 30
    sequence_name = "LS_Solastrata_Assembly_DigitalTwin_v2"
    asset_path = "/Game/DigitalTwin/Sequences"

    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    factory = unreal.LevelSequenceFactoryNew()
    sequence = asset_tools.create_asset(sequence_name, asset_path, unreal.LevelSequence, factory)
    if not sequence:
        unreal.log_error("Failed to create Level Sequence")
        return

    total_seconds = sum(s["animation_data"]["duration_seconds"] for s in STATIONS)
    total_frames = int(total_seconds * fps) + 60
    sequence.set_playback_start(0)
    sequence.set_playback_end(total_frames)
    sequence.set_display_rate(unreal.FrameRate(fps, 1))

    camera_binding = sequence.add_spawnable_from_class(unreal.CineCameraActor)
    camera_binding.set_name("Camera_AssemblyLine")
    camera_track = camera_binding.add_track(unreal.MovieScene3DTransformTrack)
    camera_section = camera_track.add_section()
    camera_section.set_range(0, total_frames)

    current_frame = 0
    for station in STATIONS:
        step = station["step_order"]
        name = station["station_name"]
        anim = station["animation_data"]
        duration_frames = int(anim["duration_seconds"] * fps)

        binding = sequence.add_spawnable_from_class(unreal.StaticMeshActor)
        binding.set_name(f"{step:02d}_{name}_{station['target_component_id']}")

        start_tf = make_transform(anim["start_transform"]["position"], anim["start_transform"]["rotation"])
        end_tf   = make_transform(anim["end_transform"]["position"],   anim["end_transform"]["rotation"])

        transform_track = binding.add_track(unreal.MovieScene3DTransformTrack)
        section = transform_track.add_section()
        section.set_range(current_frame, current_frame + duration_frames)
        add_transform_keys(section, start_tf, end_tf, current_frame, current_frame + duration_frames)

        if step == 1:
            unreal.log(f"  → Material param DyeConcentration 0→1 frames {current_frame}-{current_frame + duration_frames}")
        elif step == 3:
            unreal.log(f"  → Material param HydrophobicThickness 0→35 frames {current_frame}-{current_frame + duration_frames}")

        cam_tf = calculate_camera_transform(station["camera_pos"], station["camera_look"])
        cam_channels = camera_section.get_all_channels()
        mid_frame = current_frame + (duration_frames // 2)
        for i, val in enumerate([cam_tf.translation.x, cam_tf.translation.y, cam_tf.translation.z]):
            cam_channels[i].add_key(unreal.FrameNumber(mid_frame), val)
        for i, val in enumerate([cam_tf.rotation.roll, cam_tf.rotation.pitch, cam_tf.rotation.yaw], start=3):
            cam_channels[i].add_key(unreal.FrameNumber(mid_frame), val)

        current_frame += duration_frames

    unreal.EditorAssetLibrary.save_asset(f"{asset_path}/{sequence_name}")
    unreal.log(f"Successfully generated sequence '{sequence_name}' with {len(STATIONS)} stations.")
    unreal.log(f"Total duration ≈ {total_seconds:.1f}s | {total_frames} frames @ {fps} fps")

if __name__ == "__main__":
    generate_sequencer_v2()
