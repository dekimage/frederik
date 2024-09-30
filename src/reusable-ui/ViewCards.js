const { Button } = require("@/components/ui/button");
const {
  Dialog,
  DialogTrigger,
  DialogContent,
} = require("@/components/ui/dialog");

const ViewCards = ({ cards, buttonText, CardComponent }) => {
  return (
    <Dialog className="min-w-fit min-h-fit overflow-y-scroll">
      <DialogTrigger>
        <Button variant="outline">{buttonText}</Button>
      </DialogTrigger>

      <DialogContent className="min-w-fit min-h-fit overflow-y-scroll max-h-[600px]">
        <div className="flex flex-wrap justify-center gap-4">
          {cards.map((c, i) => (
            <CardComponent key={i} card={c} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewCards;
