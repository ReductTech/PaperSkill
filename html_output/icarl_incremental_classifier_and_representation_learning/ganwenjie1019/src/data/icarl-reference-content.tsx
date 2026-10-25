import type { ReferenceItem, TermDefinition } from "../shared/core/reference/types";
import type { ReactNode } from "react";

export const ICARL_TERMS: Record<string, TermDefinition> = {
  "class-incremental-learning": {
    id: "class-incremental-learning", label: "Class-Incremental Learning", fullName: "Class-Incremental Learning",
    definition: "Classes arrive over time in batches. After every update, the learner must predict among all classes seen so far, without being told which batch a test image came from.",
    paperRole: "This is the setting iCaRL is designed for: each update incorporates new classes while preserving recognition of earlier ones.", confusion: "It is not a sequence of separate classifiers that predict only within the newest batch.", sourceKind: "Task setting",
  },
  "catastrophic-forgetting": {
    id: "catastrophic-forgetting", label: "Catastrophic Forgetting", definition: "After learning new classes, a model can lose accuracy on earlier classes because updates have changed its shared parameters and representations.",
    paperRole: "This motivates combining exemplar rehearsal with distillation instead of updating on newly arriving images alone.", confusion: "It refers to degraded performance on previously learned classes, not simply weak performance on new classes.", sourceKind: "Background",
  },
  representation: {
    id: "representation", label: "Feature Representation", definition: "The vector φΘ(x) produced by the shared feature mapping for an input image. Output nodes use it during training, and the exemplar-based classifier uses it at prediction time.",
    paperRole: "iCaRL continues to update this shared representation as classes arrive, so old exemplars must be encoded in the current feature space when prototypes are rebuilt.", confusion: "A representation is an intermediate feature vector, not a class label or the final prediction.", sourceKind: "Method",
  },
  "feature-extractor": {
    id: "feature-extractor", label: "Feature Extractor", definition: "The shared, trainable part of the network that maps a raw image to a feature vector φΘ(x). The output layer receives this vector rather than the pixels directly.",
    paperRole: "Its parameters Θ change during incremental training; retained exemplars are stored as images so they can be re-encoded after those changes.", confusion: "It produces a representation; it does not itself choose the predicted class.", sourceKind: "Method",
  },
  prototype: {
    id: "prototype", label: "Class Prototype", definition: "A class reference vector formed by averaging that class's exemplar features in the current representation space and normalizing the resulting mean.",
    paperRole: "iCaRL recomputes each prototype from retained exemplars and predicts with the prototype closest to the query feature.", confusion: "A prototype is recomputed from data; it is not an output-layer weight learned independently by gradient descent.", sourceKind: "Method",
  },
  "nearest-mean-of-exemplars": {
    id: "nearest-mean-of-exemplars", label: "Nearest-Mean-of-Exemplars (NME)", fullName: "Nearest-Mean-of-Exemplars (NME)",
    definition: "For each class, average and normalize the current features of its retained exemplars. Assign a query to the class whose exemplar mean is closest to the query feature.",
    paperRole: "This is iCaRL's final prediction rule. The learned output layer supports representation learning, but its argmax is not used as the final classifier.", confusion: "NME uses a mean computed from a bounded set of retained exemplars; it is not the same as a mean over every historical training image.", sourceKind: "Method",
  },
  exemplar: {
    id: "exemplar", label: "Exemplar", definition: "A real training image selected and retained as a representative sample of its class. iCaRL stores the image itself, not a cached feature vector.",
    paperRole: "The bounded exemplar memory supplies old-class images for replay and approximates each class mean for nearest-mean prediction.", confusion: "An exemplar is a raw input image with an identity and selection order, not its feature representation or prototype.", sourceKind: "Method",
  },
  "memory-budget": {
    id: "memory-budget", label: "Exemplar Memory Budget K", definition: "The maximum total number of raw images that may be retained in exemplar memory across all learned classes.",
    paperRole: "With an equal allocation across t classes, the per-class quota is approximately K/t, subject to integer rounding and the available examples.", confusion: "K counts retained exemplar images; it does not cap the model parameters or output weights, which can grow as classes are added.", sourceKind: "Method",
  },
  herding: {
    id: "herding", label: "Herding", definition: "A greedy, ordered selection procedure. At each round, add the candidate whose new normalized prefix mean is closest to the normalized mean of the full class.",
    paperRole: "Herding creates a prioritized exemplar list when a class is first available; earlier selections remain useful when a future budget keeps only a shorter prefix.", confusion: "Each round makes a local greedy choice; it does not guarantee a globally optimal subset or a steadily decreasing distance. Later quota reductions truncate the list rather than rerunning selection on unavailable old data.", sourceKind: "Method",
  },
  "prefix-mean": {
    id: "prefix-mean", label: "Prefix Mean", definition: "The mean feature vector of the first k exemplars in the ordered Herding list, computed from their current representations.",
    paperRole: "For every candidate addition, Herding forms the resulting prefix mean, normalizes it, and compares it with the normalized full-class target.", confusion: "The prefix mean uses only the selected exemplars up to position k; it is not the mean of all currently available class images.", sourceKind: "Method",
  },
  "response-snapshot-q": {
    id: "response-snapshot-q", label: "Response Snapshot Q", definition: "The pre-update sigmoid outputs of the existing class nodes, recorded for every training example in D. Rows are aligned with input images by sample identity; columns correspond only to previously learned classes.",
    paperRole: "Q provides fixed distillation targets for old output nodes during the current update and can be discarded when training finishes.", confusion: "Q stores output scores, not logits or a second set of model weights, and it contains no responses for newly added output nodes.", sourceKind: "Method",
    formula: <span>q<sub>ij</sub> = g<sub>j</sub>(x<sub>i</sub>; Θ<sub>before</sub>)</span>,
  },
  distillation: {
    id: "distillation", label: "Knowledge Distillation", definition: "A training signal that asks the updated network to reproduce the old model's stored responses on previously learned class outputs.",
    paperRole: "In iCaRL, the old-node targets come from Q while newly added nodes use class-indicator labels; both signals train the same updated model on D.", confusion: "Distillation transfers old output behavior through targets; the frozen teacher does not replace the Student being updated.", sourceKind: "Method",
  },
  "soft-target": {
    id: "soft-target", label: "Soft Target", definition: "A continuous target value copied from an old model's sigmoid response before the current parameter update. It can preserve how strongly an old node responded, rather than reducing that response to a binary label.",
    paperRole: "For each old output node, the Student is trained toward the corresponding value qᵢⱼ in the same image's frozen Q row.", confusion: "Old nodes use independent sigmoid outputs, so their soft targets do not need to sum to one and are not a multiclass softmax distribution.", sourceKind: "Method",
    formula: <span>r<sub>ij</sub> = q<sub>ij</sub> (old node)</span>,
  },
  "hard-target": {
    id: "hard-target", label: "Hard Target", fullName: "Class-Indicator Target",
    definition: "A binary 0/1 target derived from an image's ground-truth class for each newly added output node.",
    paperRole: "For a new-class node, the target is 1 when the image belongs to that class and 0 for the other newly added classes; this applies to every image in D.", confusion: "Target source is determined by the age of the output node, not by whether the input image is an old exemplar or a new image. Old nodes still use Q.", sourceKind: "Method",
    formula: <span>r<sub>ij</sub> = 𝟙[y<sub>i</sub> = c<sub>j</sub>] (new node)</span>,
  },
  "binary-cross-entropy": {
    id: "binary-cross-entropy", label: "Binary Cross-Entropy (BCE)", fullName: "Binary Cross-Entropy (BCE)",
    definition: "The binary loss between one sigmoid output g and its target r. It applies to both continuous teacher targets and binary class-indicator targets.",
    paperRole: "Old nodes use Q-derived soft targets and new nodes use hard labels. iCaRL evaluates the node-wise terms across the outputs for each example and optimizes them together.", sourceKind: "Method",
    formula: <span>ℓ<sub>BCE</sub>(r,g) = −[r log g + (1−r) log(1−g)]</span>,
  },
  ncm: {
    id: "ncm", label: "NCM", fullName: "Nearest Class Mean (NCM)",
    definition: "A classifier that assigns a query to the class whose mean feature vector is nearest, using the examples available for each class to compute that mean.",
    paperRole: "The paper compares iCaRL with an all-data NCM diagnostic to measure the cost of approximating class means with a bounded exemplar set.", confusion: "This NCM reference can use all historical training images and therefore does not share iCaRL's exemplar-memory constraint.", sourceKind: "Experimental reference",
  },
  "average-incremental-accuracy": {
    id: "average-incremental-accuracy", label: "Average Incremental Accuracy", fullName: "Average Incremental Accuracy",
    definition: "A summary of multiclass test accuracy measured after successive incremental updates, with each evaluation covering the classes learned up to that stage.",
    paperRole: "Figure 2 tracks accuracy as the number of learned classes grows; the paper also reports averages over incremental stages when comparing methods.", confusion: "Read each benchmark's class order, batch size, and evaluation protocol alongside the metric; results from different protocols are not directly interchangeable.", sourceKind: "Evaluation metric",
  },
};

type HubTermCopy = { title: string; summary: string; role?: string; confusion?: string; extra?: ReactNode; tags: string[] };
const HUB_TERM_COPY: Record<string, HubTermCopy> = {
  "class-incremental-learning": { title: "Class-Incremental Learning", summary: "Classes arrive in sequential batches, but evaluation after each update covers every class seen so far. The learner is not told which batch a test image belongs to.", role: "This is iCaRL's task setting: it must incorporate new classes while maintaining a single classifier over old and new classes.", confusion: "It is not task-incremental prediction, where the active task or class subset is supplied at test time.", tags: ["class incremental", "task setting"] },
  "catastrophic-forgetting": { title: "Catastrophic Forgetting", summary: "An update on new classes can alter shared parameters enough to sharply reduce accuracy on earlier classes, even when new-class performance improves.", role: "The paper addresses this risk by combining replayed exemplars with a distillation loss that preserves old output responses.", confusion: "Forgetting concerns loss of previously learned behavior; it is different from a model simply failing to learn the newest classes.", tags: ["forgetting", "continual learning"] },
  representation: { title: "Feature Representation", summary: "The shared feature mapping φΘ(x) converts an image into a vector used by the output nodes during training and by exemplar-based classification at test time.", role: "Incremental updates change this representation. iCaRL therefore re-encodes stored exemplar images before rebuilding prototypes in the current feature space.", confusion: "A feature vector is an intermediate description of an image, not a class label, output score, or final prediction.", tags: ["features", "representation learning"] },
  "feature-extractor": { title: "Feature Extractor", summary: "The shared, trainable network that maps raw pixels to a feature vector φΘ(x), which is then supplied to the class-output layer.", role: "Its parameters Θ are updated as new classes arrive. Because those updates can move old images in feature space, retained exemplars are stored as raw images and encoded again when needed.", confusion: "The feature extractor produces representations; it does not itself select the predicted class.", tags: ["shared network", "feature mapping"] },
  prototype: { title: "Class Prototype", summary: "A class reference vector formed by averaging the current feature vectors of its retained exemplars and normalizing the mean.", role: "iCaRL recomputes one prototype per learned class, then predicts from the nearest prototype to the query feature.", confusion: "A prototype is derived from stored examples and the current feature extractor; it is not an independently trained output-layer weight.", tags: ["class mean", "nearest prototype"] },
  "nearest-mean-of-exemplars": { title: "Nearest-Mean-of-Exemplars (NME)", summary: "Build a prototype from each class's retained exemplars, encode the query with the same current feature extractor, and assign the nearest class mean.", role: "NME is iCaRL's final classification rule. The learned sigmoid output layer trains the representation but its argmax is not used for the final prediction.", confusion: "NME approximates each full class mean from a bounded, ordered exemplar set rather than using every historical training image.", tags: ["nearest mean", "prediction"] },
  exemplar: { title: "Exemplar", summary: "A real training image selected to represent its class and retained as part of the bounded memory. The image identity and its position in the selected list matter.", role: "Retained exemplars are replayed during later updates and re-encoded to approximate class means after the representation changes.", confusion: "An exemplar is the raw input image, not a cached feature vector or the class prototype computed from several images.", tags: ["memory", "retained image"] },
  "memory-budget": { title: "Exemplar Memory Budget K", summary: "The upper bound K on how many raw exemplar images can be retained across all classes; it is the image-memory budget, not a limit on model parameters.", role: "With equal allocation over t classes, each class receives roughly K/t slots, with integer rounding and availability determining the exact count.", confusion: "As the number of classes grows, the exemplar quota shrinks, but the model's class-output weights are a separate resource that also grows.", tags: ["quota", "bounded memory"] },
  herding: { title: "Herding", summary: "A greedy selection rule that repeatedly adds the candidate whose resulting normalized prefix mean is closest to the normalized mean of the full class.", role: "Herding builds a prioritized list when a class's full training data is available. Earlier items remain the most valuable when a later budget keeps only a prefix.", confusion: "Each round chooses the current best candidate; this does not guarantee a globally optimal subset or monotonic distance decrease. Later quota reductions truncate the stored order instead of rerunning selection on unavailable old data.", tags: ["sample selection", "ordered memory"] },
  "prefix-mean": { title: "Prefix Mean", summary: "The mean feature vector of the first k exemplars in Herding's selected order, using their current representations.", role: "For every candidate addition, Herding forms and normalizes the new prefix mean, then measures its distance to the normalized full-class target.", confusion: "It uses only the selected prefix; it is not the full mean computed from every available class image.", tags: ["Herding", "mean"] },
  "response-snapshot-q": { title: "Response Snapshot Q", summary: "Q stores the pre-update sigmoid responses of old class-output nodes for every image in the current training set D. Each row aligns with one image by sample ID, and each column represents one previously learned class.", role: "Q supplies fixed distillation targets during the current update. Both replayed old images and new-class images have rows because both are included in D; the new output nodes are not columns in Q.", confusion: "Q contains output scores, not logits, images, or a second copy of the teacher's weights. It is created before training and can be discarded after the update.", extra: <><div className="icarl-reference-formula" role="math" aria-label="q i j equals old model output g j of x i at parameters before update">q<sub>ij</sub> = g<sub>j</sub>(x<sub>i</sub>; Θ<sub>before</sub>)</div><p>For N training images and C<sub>old</sub> previously learned classes, Q has N rows and C<sub>old</sub> columns. Row i must stay paired with the same sample x<sub>i</sub> throughout the update.</p></>, tags: ["old responses", "frozen targets"] },
  distillation: { title: "Knowledge Distillation", summary: "Distillation asks the updated Student to reproduce the old model's stored responses on previously learned output nodes, preserving behavior that might otherwise shift during training.", role: "iCaRL obtains the old-node targets from Q and combines them with true class-indicator targets for new nodes. Both target types train the same Student on D.", confusion: "The frozen teacher contributes target values; it does not replace the Student or need to be retained as a second trainable network after Q is recorded.", extra: <p className="icarl-reference-callout">Only the old-node targets are copied from the teacher. The current Student receives the parameter updates.</p>, tags: ["old classes", "training objective"] },
  "soft-target": { title: "Soft Target", summary: "A continuous target copied from an old model's pre-update sigmoid response. It preserves the response strength for an old class rather than replacing it with a binary label.", role: "For each old node, the Student is trained toward qᵢⱼ in the same image's frozen Q row.", confusion: "The old outputs use independent sigmoids, not a class-normalized softmax. Their target values do not need to sum to one.", extra: <div className="icarl-reference-formula" role="math" aria-label="the old node target r i j equals q i j">r<sub>ij</sub> = q<sub>ij</sub> (old node)</div>, tags: ["response", "sigmoid"] },
  "hard-target": { title: "Hard Target", summary: "A binary 0/1 class-indicator target derived from an image's ground-truth label for each newly added output node.", role: "For a new-class node, the target is 1 when the image belongs to that class and 0 for the other new classes; this target is defined for every image in D.", confusion: "The target source depends on whether the output node is old or new, not whether the image is an old exemplar or a new image. Old nodes still use Q.", extra: <div className="icarl-reference-formula" role="math" aria-label="the new node target r i j is the indicator that y i equals class c j">r<sub>ij</sub> = 𝟙[y<sub>i</sub> = c<sub>j</sub>] (new node)</div>, tags: ["class label", "training target"] },
  "binary-cross-entropy": { title: "Binary Cross-Entropy (BCE)", summary: "The loss between one independent sigmoid output g and its target r. The same formula handles a soft teacher response or a hard 0/1 class indicator.", role: "Old output nodes use Q-derived targets; new output nodes use labels. iCaRL sums node-wise terms across outputs and training examples to form the update objective.", extra: <>
    <div className="icarl-reference-formula" role="math" aria-label="BCE loss formula">ℓ<sub>BCE</sub>(r,g) = −[r log g + (1−r) log(1−g)]</div>
    <div className="icarl-reference-formula" role="math" aria-label="Hard target one simplifies to negative log g">r=1:　ℓ=−log g</div>
    <div className="icarl-reference-formula" role="math" aria-label="Hard target zero simplifies to negative log one minus g">r=0:　ℓ=−log(1−g)</div>
    <div className="icarl-reference-formula" role="math" aria-label="Soft target q uses both terms and is minimized at g equals q">r=q:　ℓ=−[q log g+(1−q)log(1−g)], minimized at g=q</div>
    <p>A hard target of 1 encourages g toward 1; a hard target of 0 encourages g toward 0. A soft target's minimum is generally nonzero: at g=q, it equals the binary entropy of q.</p>
    <p><b>Variables</b> · r ∈ [0,1] is the target; g = σ(a) ∈ (0,1) is the node's sigmoid output; a is its logit.</p>
    <div className="icarl-reference-formula" role="math" aria-label="the local derivative equals g minus r">∂ℓ / ∂a = g − r</div>
    <p><b>Target source</b> · For an old node, r=q<sub>ij</sub> from the same image's frozen Q row. For a new node, r=𝟙[y<sub>i</sub>=c<sub>j</sub>] from the true label. Node age determines the source.</p>
    <p><b>Multiple outputs</b> · Each node has an independent sigmoid; the outputs are not normalized by a six-class softmax. For one image, ℓ<sub>i</sub>=∑<sub>j=1</sub><sup>t</sup>ℓ<sub>BCE</sub>(r<sub>ij</sub>,g<sub>ij</sub>), so old- and new-node terms both contribute to learning.</p>
  </>, tags: ["loss", "sigmoid", "targets"] },
  ncm: { title: "Nearest Class Mean (NCM)", summary: "Classify by computing a mean feature vector for each class and assigning the query to the nearest mean.", role: "The paper uses an all-data NCM reference to assess how much accuracy is lost when class means are approximated by a small exemplar set.", confusion: "The diagnostic NCM can revisit every historical training image after representation updates, so it does not share iCaRL's bounded-memory constraint.", tags: ["diagnostic reference", "all-data mean"] },
  "average-incremental-accuracy": { title: "Average Incremental Accuracy", summary: "A summary of multiclass test accuracy over successive updates, with each stage evaluated on all classes learned up to that point.", role: "Figure 2 shows accuracy as the number of learned classes grows; the paper also aggregates results across incremental stages when comparing methods.", confusion: "Interpret the score together with the benchmark's class order, batch size, and evaluation protocol; numbers from different protocols are not directly interchangeable.", tags: ["metric", "Figure 2"] },
};

function TermReferenceContent({ copy }: { copy: HubTermCopy }) {
  return <div>{copy.role ? <p><strong>Role in this paper:</strong> {copy.role}</p> : null}{copy.confusion ? <p><strong>Easy to confuse with:</strong> {copy.confusion}</p> : null}{copy.extra ? <div className="icarl-reference-extra">{copy.extra}</div> : null}</div>;
}

const termReferences: ReferenceItem[] = Object.values(ICARL_TERMS).map((term) => {
  const copy = HUB_TERM_COPY[term.id];
  return {
    id: term.id,
    title: copy.title,
    kind: "term",
    summary: copy.summary,
    content: <TermReferenceContent copy={copy} />,
    tags: copy.tags,
  };
});

const sourceReferences: ReferenceItem[] = [
  {
    id: "icarl-paper", title: "iCaRL: Incremental Classifier and Representation Learning", kind: "evidence",
    summary: "The original iCaRL paper introduces a class-incremental learning method built from nearest-mean-of-exemplars classification, herding-based memory selection, and representation learning with distillation. It reports experiments on CIFAR-100 and ILSVRC and analyzes the contribution of each component.",
    content: <p><a href="http://arxiv.org/abs/1611.07725" target="_blank" rel="noreferrer">Open the paper on arXiv</a></p>, tags: ["primary paper", "arXiv"],
  },
  {
    id: "cifar-100-dataset", title: "CIFAR-100 dataset", kind: "dataset",
    summary: "CIFAR-100 contains 60,000 32×32 color images across 100 fine classes, with 500 training and 100 test images per class. The classes are grouped into 20 superclasses; the iCaRL paper evaluates class-incremental splits of this benchmark.",
    content: <p><a href="https://www.cs.toronto.edu/~kriz/cifar.html" target="_blank" rel="noreferrer">CIFAR-10 and CIFAR-100 datasets · University of Toronto</a></p>, tags: ["dataset background", "official source"],
  },
  {
    id: "ilsvrc-2012-dataset", title: "ImageNet ILSVRC 2012", kind: "dataset",
    summary: "The ILSVRC 2012 classification benchmark covers 1,000 object categories, with about 1.2 million training images and 50,000 labeled validation images. The iCaRL paper studies incremental variants of this benchmark, whose class order and protocol should be distinguished from the full challenge setup.",
    content: <p><a href="https://www.image-net.org/challenges/LSVRC/2012/" target="_blank" rel="noreferrer">ILSVRC 2012 · ImageNet</a></p>, tags: ["dataset background", "official source"],
  },
];

export const ICARL_REFERENCE_ITEMS: ReferenceItem[] = [...termReferences, ...sourceReferences];

export type ReferenceOpenEvent = CustomEvent<{ termId: string }>;
export function requestReferenceOpen(termId: string) {
  window.dispatchEvent(new CustomEvent("icarl:open-reference", { detail: { termId } }));
}
