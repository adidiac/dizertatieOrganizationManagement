#!/usr/bin/env python3
"""
service_performance.py

Quick benchmark of core functions in your cybersecurity service,
with a single bar chart of mean latency for each operation.

Usage:
  python service_performance.py
"""

import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from proxyHR import HRDataProxy
from risk_analysis import compute_all_person_risks
from predict.predictRisk import predict_attack_risk
from anomaly_detection import detect_anomalies
from bpmn_generator import build_bpmn_xml

# Initialize proxy to your HR service
HR_API_URL = "http://localhost:5004/api"
proxy = HRDataProxy(HR_API_URL)

def bench_compute_all_person_risks(iterations=5):
    times = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        _ = compute_all_person_risks(proxy, attack_type="phishing")
        t1 = time.perf_counter()
        times.append(t1 - t0)
    return np.mean(times)

def bench_predict_attack_risk(samples=100):
    latencies = []
    for attrs in np.random.rand(samples,6):
        t0 = time.perf_counter()
        _ = predict_attack_risk(attrs.tolist(), "phishing")
        t1 = time.perf_counter()
        latencies.append(t1 - t0)
    return np.mean(latencies)

def bench_detect_anomalies():
    # run one full risk pass to get data
    persons = compute_all_person_risks(proxy, attack_type="phishing")
    scores = [r["composite_risk"] for r in persons]
    t0 = time.perf_counter()
    _ = detect_anomalies(scores, contamination=0.1)
    t1 = time.perf_counter()
    return t1 - t0

def bench_build_bpmn_xml():
    np.random.seed(0)
    # small
    persons_s = [{"id":i,"type":"person","full_name":f"P{i}"} for i in range(10)]
    entities_s= [{"id":10+i,"type":"entity","name":f"E{i}"} for i in range(5)]
    nodes_s = persons_s + entities_s
    links_s = [{"source": np.random.choice(nodes_s)["id"],
                "target": np.random.choice(nodes_s)["id"]} for _ in range(20)]
    t0 = time.perf_counter()
    _ = build_bpmn_xml(nodes_s, links_s)
    t1 = time.perf_counter()
    # large
    persons_l = [{"id":i,"type":"person","full_name":f"P{i}"} for i in range(100)]
    entities_l= [{"id":100+i,"type":"entity","name":f"E{i}"} for i in range(50)]
    nodes_l = persons_l + entities_l
    links_l = [{"source": np.random.choice(nodes_l)["id"],
                "target": np.random.choice(nodes_l)["id"]} for _ in range(500)]
    t2 = time.perf_counter()
    _ = build_bpmn_xml(nodes_l, links_l)
    t3 = time.perf_counter()
    return (t1 - t0, t3 - t2)

def main():
    # measure mean latencies
    m_risk    = bench_compute_all_person_risks()
    m_predict = bench_predict_attack_risk()
    m_anom    = bench_detect_anomalies()
    t_small, t_large = bench_build_bpmn_xml()

    df = pd.DataFrame({
        "operation": [
            "compute_all_person_risks",
            "predict_attack_risk",
            "detect_anomalies",
            "bpmn_small",
            "bpmn_large"
        ],
        "mean_latency_s": [
            m_risk, m_predict, m_anom, t_small, t_large
        ]
    })

    # single bar chart
    plt.figure(figsize=(8,4))
    plt.bar(df["operation"], df["mean_latency_s"], color="C0")
    plt.title("Mean Latency per Core Operation")
    plt.ylabel("Latency (seconds)")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    main()
