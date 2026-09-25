"""
train_transformer_matcher.py
============================
Fine-tunes a multilingual Sentence-Transformer model (e.g., paraphrase-multilingual-MiniLM-L12-v2 or IndicBERT)
on grocery voice queries collected by the VF Smart List data collector.

Requirements:
    pip install sentence-transformers torch onnx onnxruntime transformers datasets

Usage:
    python train_transformer_matcher.py --dataset ../data/voice_training_dataset.json --epochs 4 --batch_size 16
"""

import os
import json
import argparse
import torch
from sentence_transformers import SentenceTransformer, InputExample, losses, evaluation
from torch.utils.data import DataLoader

def parse_args():
    parser = argparse.ArgumentParser(description="Train Transformer Semantic Matcher for Grocery Voice Chat")
    parser.add_argument("--dataset", type=str, default="../data/voice_training_dataset.json", help="Path to JSON dataset")
    parser.add_argument("--model_name", type=str, default="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", help="Pretrained Hugging Face base model")
    parser.add_argument("--output_dir", type=str, default="../models/fine_tuned_voice_transformer", help="Output directory for fine-tuned weights")
    parser.add_argument("--epochs", type=int, default=4, help="Training epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    return parser.parse_args()

def load_dataset(dataset_path):
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    samples = data.get("samples", [])
    
    train_examples = []
    eval_queries = []
    eval_positives = []
    
    for item in samples:
        utterance = item.get("utterance", "")
        slots = item.get("slots", {})
        if isinstance(slots, list) and len(slots) > 0:
            target = slots[0].get("canonical_product", "")
        elif isinstance(slots, dict):
            target = slots.get("canonical_product", "")
        else:
            continue
            
        if utterance and target:
            # Pair query utterance with canonical product label
            train_examples.append(InputExample(texts=[utterance, target]))
            
    split_idx = int(len(train_examples) * 0.85)
    return train_examples[:split_idx], train_examples[split_idx:]

def train():
    args = parse_args()
    print(f"📦 Loading base model: {args.model_name}...")
    model = SentenceTransformer(args.model_name)

    print(f"📖 Loading dataset from {args.dataset}...")
    train_data, val_data = load_dataset(args.dataset)
    print(f"✅ Loaded {len(train_data)} training pairs, {len(val_data)} validation pairs.")

    train_dataloader = DataLoader(train_data, shuffle=True, batch_size=args.batch_size)
    
    # MultipleNegativesRankingLoss optimizes dot-product cosine similarity between query and correct product
    train_loss = losses.MultipleNegativesRankingLoss(model)

    print(f"🚀 Training for {args.epochs} epochs...")
    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        epochs=args.epochs,
        warmup_steps=int(len(train_dataloader) * 0.1),
        output_path=args.output_dir,
        show_progress_bar=True
    )

    print(f"🎉 Model fine-tuned successfully and saved to: {args.output_dir}")
    print("\nNext step: To export model to ONNX for ultra-fast browser/Node.js execution:")
    print("  python -m transformers.onnx --model=../models/fine_tuned_voice_transformer onnx/")

if __name__ == "__main__":
    train()
