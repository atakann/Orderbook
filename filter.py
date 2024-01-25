import csv
import json

input_file = ""
output_file = "filteredData.json"
start_timestamp = 1703894399978000
end_timestamp = start_timestamp + 1500000  # 1.5 seconds


def process_csv_to_json(input_file, output_file, start_timestamp, end_timestamp):
    filtered_rows = []

    with open(input_file, "r", encoding="utf-8") as infile:
        reader = csv.DictReader(infile)

        for row in reader:
            if start_timestamp <= int(row["timestamp"]) <= end_timestamp:
                row["timestamp"] = int(row["timestamp"])
                row["local_timestamp"] = int(row["local_timestamp"])
                row["is_snapshot"] = row["is_snapshot"].lower() == "true"
                row["price"] = float(row["price"])
                row["amount"] = float(row["amount"])
                filtered_rows.append(row)

    with open(output_file, "w", encoding="utf-8") as outfile:
        json.dump(filtered_rows, outfile, indent=4)

    print("Done processing.")


process_csv_to_json(input_file, output_file, start_timestamp, end_timestamp)
