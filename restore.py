import json

log_file = "/Users/tavishagarwal/.gemini/antigravity/brain/aae3351d-3158-4218-93bf-15a25d6c47a2/.system_generated/logs/overview.txt"

files_to_restore = [
    "/Users/tavishagarwal/Desktop/Momento/src/index.css",
    "/Users/tavishagarwal/Desktop/Momento/src/pages/Home.tsx",
    "/Users/tavishagarwal/Desktop/Momento/src/pages/Dashboard.tsx",
    "/Users/tavishagarwal/Desktop/Momento/src/components/TripleClock.tsx",
    "/Users/tavishagarwal/Desktop/Momento/src/components/TripleClockPanel.tsx",
    "/Users/tavishagarwal/Desktop/Momento/src/components/NavBar.tsx",
    "/Users/tavishagarwal/Desktop/Momento/src/components/OfferCard.tsx",
    "/Users/tavishagarwal/Desktop/Momento/src/components/ErrorBoundary.tsx"
]

file_contents = {}

with open(log_file, "r") as f:
    for line in f:
        try:
            entry = json.loads(line)
            if entry.get("type") == "PLANNER_RESPONSE" and "tool_calls" in entry:
                for call in entry["tool_calls"]:
                    if call["name"] in ["write_to_file", "replace_file_content"]:
                        args = call.get("args", {})
                        target = args.get("TargetFile", "")
                        # We want the FIRST write_to_file for each file, which corresponds to the initial code.
                        if target in files_to_restore and target not in file_contents:
                            if "CodeContent" in args:
                                file_contents[target] = args["CodeContent"]
        except Exception as e:
            pass

for target, content in file_contents.items():
    print(f"--- Found initial version for {target} (length {len(content)}) ---")
    with open(target, "w") as f:
        f.write(content)
print("Done restoring files.")
