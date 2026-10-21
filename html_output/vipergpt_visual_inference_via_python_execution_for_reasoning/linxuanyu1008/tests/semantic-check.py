"""Execute displayed tutorial Python with deterministic source-backed stand-ins.
Does not run visual/LLM models or reproduce paper evaluation accuracy.
"""
import ast
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def lines(file, name):
    source = (ROOT / "src/modules" / file).read_text(encoding="utf-8-sig")
    match = re.search(r"(?:export )?const " + name + r"\s*=\s*(\[.*?\]);", source, re.S)
    assert match, name
    return ast.literal_eval(match.group(1))

class Patch:
    def __init__(self, name="image", depth=0, x=0, objects=None, properties=(), caption=""):
        self.name, self.depth, self.horizontal_center = name, depth, x
        self.objects, self.properties, self.caption = objects or {}, properties, caption
    def find(self, name): return self.objects.get(name, [])
    def compute_depth(self): return self.depth
    def verify_property(self, object_name, property_name):
        assert object_name in ("pancake", "bookcase")
        return property_name in self.properties
    def simple_query(self, query): return self.caption
    def exists(self, name): return bool(self.find(name))

class Video:
    def __init__(self, frames): self.frames, self.num_frames = frames, len(frames)
    def frame_iterator(self): return iter(self.frames)

def ImagePatch(value, index=None):
    return value.frames[index] if isinstance(value, Video) else value

def select_answer(info, question, possible_answers):
    if question == "dog":
        assert info["Dog looks like he is doing"] == "sitting"
        return "Sit on the ground"
    assert "Caption of frame after dropping the sparkles" in info
    return "pick it up"

def run(code, value, video=False, question="boy"):
    if code[0].startswith("def "):
        program = "\n".join(code)
    else:
        program = "def execute_command(" + ("video_segment" if video else "image") + "):\n" + "\n".join("    " + line for line in code)
    env = dict(ImagePatch=ImagePatch, question=question, possible_answers=[], select_answer=select_answer,
               llm_query=lambda query: "hibernate")
    exec(compile(program, "<displayed tutorial program>", "exec"), env)
    return env["execute_command"](value)

muffin = lines("reasoning-lab.tsx", "muffinCode")
for count, answer in [(8,"4"),(6,"3")]:
    image = Patch(objects={"muffin":[Patch() for _ in range(count)],"kid":[Patch(),Patch()]})
    assert run(muffin,image) == answer
pizza = lines("pizza-lab.tsx", "pizzaProgram")
a, b = Patch("A",.7), Patch("B",.3)
assert run(pizza,Patch(objects={"pizza":[a,b]})).name == "B"
pancake = lines("reasoning-lab.tsx","pancakeCode")
assert run(pancake,Patch(objects={"pancake":[Patch(properties=("brown","round"))]})) == "yes"
assert run(pancake,Patch(objects={"pancake":[Patch(properties=("brown",))]})) == "no"
bookcase = lines("reasoning-lab.tsx","bookcaseCode")
assert run(bookcase,Patch(objects={"bookcase":[Patch(x=239,properties=("wood",))],"water bottle":[Patch(x=608.5)]})) == "yes"
assert run(lines("knowledge-video-lab.tsx","knowledgeLines"),Patch(caption="bear")) == "hibernate"
after = lines("knowledge-video-lab.tsx","afterLines")
frames = [Patch(caption="no") for _ in range(27)]
frames[25] = Patch(objects={"boy":[Patch()],"sparkles":[Patch()]},caption="yes")
frames[26] = Patch(objects={"boy":[Patch(caption="a child running with fire in his hands")]})
assert run(after,Video(frames),True) == "pick it up"
# Actual program must directly access frame 2 when no event was found in four frames.
visited=[]
class TrackedVideo(Video): pass
original_ImagePatch=ImagePatch
def ImagePatch(value,index=None):
    if isinstance(value,Video): visited.append(index)
    return original_ImagePatch(value,index)
assert run(after,Video([Patch(caption="no") for _ in range(4)]),True) == "pick it up"
assert visited[-1] == 2, visited
assert run(lines("knowledge-video-lab.tsx","endLines"),Video([Patch(objects={"dog":[Patch(caption="sitting")]},caption="a black dog sitting in the grass")]),True,"dog") == "Sit on the ground"
assert visited[-1] == -1, visited
for code, expected in zip(lines("pizza-lab.tsx", "distancePrograms"), [369.5,398.8]):
    env={}
    exec(compile("\n".join(code),"<displayed distance example>","exec"),env)
    assert abs(env["pixel_distance"] - expected) < 0.05
# Test the alternative code actually displayed by the teaching controls.
reverse_pizza = lines("pizza-lab.tsx", "reversePizzaProgram")
assert run(reverse_pizza,Patch(objects={"pizza":[a,b]})).name == "A"
assert run(pizza,Patch(objects={"pizza":[Patch("A",.1),Patch("B",.9)]})).name == "A"
assert run(pizza,Patch(objects={"pizza":[a]})).name == "A"
assert run(pizza,Patch(objects={"pizza":[Patch("A",.5),Patch("B",.5)]})).name == "A"
try:
    run(pizza,Patch(objects={"pizza":[]}))
except IndexError:
    pass
else:
    raise AssertionError("empty list must fail at index 0")
for bottle_x, book_x, expected in [(0,239,"no"),(239,239,"no"),(240,239,"yes")]:
    value=Patch(objects={"bookcase":[Patch(x=book_x,properties=("wood",))],"water bottle":[Patch(x=bottle_x)]})
    assert run(bookcase,value)==expected
or_code=lines("reasoning-lab.tsx","pancakeOrCode")
for brown in (False,True):
    for round_ in (False,True):
        properties=(["brown"] if brown else [])+(["round"] if round_ else [])
        value=Patch(objects={"pancake":[Patch(properties=properties)]})
        assert run(pancake,value)==("yes" if brown and round_ else "no")
        assert run(or_code,value)==("yes" if brown or round_ else "no")
for count in range(9):
    for children in (1,2):
        value=Patch(objects={"muffin":[Patch() for _ in range(count)],"kid":[Patch() for _ in range(children)]})
        assert run(muffin,value)==str(count//children)
try:
    run(muffin,Patch(objects={"muffin":[Patch()],"kid":[]}))
except ZeroDivisionError:
    pass
else:
    raise AssertionError("no children must fail at division")
print("PASS: displayed programs, sorting and altered depths, missing/empty detections, stable ties, AND/OR truth tables, division, source video branches and 2D distance")
